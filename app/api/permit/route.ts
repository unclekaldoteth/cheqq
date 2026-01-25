/**
 * Permit API Route
 * Issues short-lived EIP-712 signed permits for gated contract calls
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
    createSignedPermit,
    computeActionHash,
    ACTIONS,
} from "@/lib/permit";
import { SCHEMA_UIDS } from "@/lib/eas";
import { type Hex } from "viem";
import { randomUUID } from "crypto";

// Rate limits (Postgres-based)
const RATE_LIMITS = {
    PERMIT_PER_MINUTE: 10,
    PERMIT_PER_HOUR: 100,
    PAYROLL_PER_DAY: 5,
};

// Gated actions contract address (to be updated after deployment)
const GATED_ACTIONS_ADDRESS: Record<number, Hex> = {
    84532: "0x0000000000000000000000000000000000000000" as Hex, // Base Sepolia - TBD
    8453: "0x0000000000000000000000000000000000000000" as Hex, // Base Mainnet - TBD
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { walletAddress, action, params, chainId } = body;

        // Validate inputs
        if (!walletAddress || typeof walletAddress !== "string") {
            return NextResponse.json(
                { error: "Invalid wallet address" },
                { status: 400 }
            );
        }

        if (!action || typeof action !== "string") {
            return NextResponse.json(
                { error: "Invalid action" },
                { status: 400 }
            );
        }

        if (!chainId || (chainId !== 84532 && chainId !== 8453)) {
            return NextResponse.json(
                { error: "Invalid chain ID. Must be 84532 (Base Sepolia) or 8453 (Base Mainnet)" },
                { status: 400 }
            );
        }

        const normalizedWallet = walletAddress.toLowerCase() as Hex;

        // Check if subject is blocked
        const blocked = await prisma.blockedSubject.findUnique({
            where: { subjectAddress: normalizedWallet },
        });

        if (blocked) {
            if (!blocked.blockedUntil || blocked.blockedUntil > new Date()) {
                await prisma.auditLog.create({
                    data: {
                        eventType: "permit_denied_blocked",
                        subjectAddress: normalizedWallet,
                        action,
                        metadata: { reason: blocked.reason },
                    },
                });
                return NextResponse.json(
                    { error: "Account is blocked", reason: blocked.reason },
                    { status: 403 }
                );
            }
        }

        // Rate limiting check
        const rateLimitCheck = await prisma.$queryRaw<[{ per_minute: bigint; per_hour: bigint; action_per_day: bigint }]>`
      SELECT 
        COUNT(*) FILTER (WHERE "createdAt" > NOW() - INTERVAL '1 minute') as per_minute,
        COUNT(*) FILTER (WHERE "createdAt" > NOW() - INTERVAL '1 hour') as per_hour,
        COUNT(*) FILTER (WHERE "createdAt" > NOW() - INTERVAL '1 day' AND "action" = ${action}) as action_per_day
      FROM "PermitNonce"
      WHERE "subjectAddress" = ${normalizedWallet}
    `;

        const counts = rateLimitCheck[0] || { per_minute: BigInt(0), per_hour: BigInt(0), action_per_day: BigInt(0) };

        if (
            Number(counts.per_minute) >= RATE_LIMITS.PERMIT_PER_MINUTE ||
            Number(counts.per_hour) >= RATE_LIMITS.PERMIT_PER_HOUR ||
            (action === "executePayroll" && Number(counts.action_per_day) >= RATE_LIMITS.PAYROLL_PER_DAY)
        ) {
            await prisma.auditLog.create({
                data: {
                    eventType: "permit_denied_rate_limit",
                    subjectAddress: normalizedWallet,
                    action,
                    metadata: { counts: { per_minute: counts.per_minute.toString(), per_hour: counts.per_hour.toString() } },
                },
            });
            return NextResponse.json(
                { error: "Rate limit exceeded. Please try again later." },
                { status: 429 }
            );
        }

        // Determine schema based on action and find attestation
        let requiredSchemaUID: Hex;
        let attestationUID: Hex | null = null;
        const schemaUIDs = chainId === 8453 ? SCHEMA_UIDS.base : SCHEMA_UIDS.baseSepolia;

        // Check if it's a freelancer or company action
        const freelancer = await prisma.freelancer.findFirst({
            where: { walletAddress: normalizedWallet },
            include: {
                kycCredentials: {
                    where: {
                        chainId,
                        revokedAt: null,
                        expiresAt: { gt: new Date() },
                    },
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
            },
        });

        const companyRole = await prisma.companyWalletRole.findFirst({
            where: {
                walletAddress: normalizedWallet,
                chainId,
                revokedAt: null,
            },
            include: {
                company: {
                    include: {
                        kybCredentials: {
                            where: {
                                chainId,
                                revokedAt: null,
                                expiresAt: { gt: new Date() },
                            },
                            orderBy: { createdAt: "desc" },
                            take: 1,
                        },
                    },
                },
            },
        });

        // Determine which attestation to use
        if (freelancer && freelancer.kycCredentials[0]?.attestationUid) {
            requiredSchemaUID = schemaUIDs.freelancerKYC;
            attestationUID = freelancer.kycCredentials[0].attestationUid as Hex;
        } else if (companyRole && companyRole.attestationUid) {
            requiredSchemaUID = schemaUIDs.companyRole;
            attestationUID = companyRole.attestationUid as Hex;
        } else {
            return NextResponse.json(
                { error: "No valid KYC/KYB attestation found. Please complete verification first." },
                { status: 403 }
            );
        }

        // Allocate nonce (atomic operation)
        const permitNonceId = randomUUID();
        const nonceResult = await prisma.$queryRaw<[{ nonce: bigint }]>`
      INSERT INTO "PermitNonce" ("id", "subjectAddress", "chainId", "nonce", "action", "createdAt")
      SELECT 
        ${permitNonceId},
        ${normalizedWallet}, 
        ${chainId}, 
        COALESCE((SELECT MAX("nonce") FROM "PermitNonce" WHERE "subjectAddress" = ${normalizedWallet} AND "chainId" = ${chainId}), 0) + 1,
        ${action},
        NOW()
      RETURNING "nonce"
    `;

        const nonce = nonceResult[0].nonce;

        // Get contract address
        const contractAddress = GATED_ACTIONS_ADDRESS[chainId];
        if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
            return NextResponse.json(
                { error: "Gated actions contract not deployed on this chain" },
                { status: 501 }
            );
        }

        // Sign permit
        const actionHash = ACTIONS[action as keyof typeof ACTIONS] || computeActionHash(action);

        const signedPermit = await createSignedPermit(
            normalizedWallet,
            actionHash,
            params,
            nonce,
            requiredSchemaUID,
            attestationUID || ("0x0000000000000000000000000000000000000000000000000000000000000000" as Hex),
            chainId,
            contractAddress
        );

        // Log permit issuance
        await prisma.auditLog.create({
            data: {
                eventType: "permit_issued",
                subjectAddress: normalizedWallet,
                action,
                metadata: {
                    nonce: nonce.toString(),
                    expiry: signedPermit.permit.expiry.toString(),
                    attestationUID,
                    chainId,
                },
            },
        });

        return NextResponse.json({
            permit: {
                subject: signedPermit.permit.subject,
                action: signedPermit.permit.action,
                paramsHash: signedPermit.permit.paramsHash,
                nonce: signedPermit.permit.nonce.toString(),
                expiry: signedPermit.permit.expiry.toString(),
                requiredSchemaUID: signedPermit.permit.requiredSchemaUID,
                requiredAttestationUID: signedPermit.permit.requiredAttestationUID,
            },
            signature: signedPermit.signature,
            attestationUID,
            chainId,
            expiresAt: new Date(Number(signedPermit.permit.expiry) * 1000).toISOString(),
        });
    } catch (error) {
        console.error("Permit error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
