/**
 * Permit API Route
 * Issues short-lived EIP-712 signed permits for gated contract calls
 * Updated for Tempo Testnet (chain ID 42431)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
    createSignedPermit,
    computeActionHash,
    ACTIONS,
    getGatedActionsAddress,
} from "@/lib/permit";
import { type Hex } from "viem";
import { randomUUID } from "crypto";

// Rate limits (Postgres-based)
const RATE_LIMITS = {
    PERMIT_PER_MINUTE: 10,
    PERMIT_PER_HOUR: 100,
    PAYROLL_PER_DAY: 5,
};

// Tempo Testnet chain ID
const TEMPO_CHAIN_ID = 42431;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { walletAddress, action, params, chainId } = body;
        const chainIdNumber = Number(chainId);

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

        if (!Number.isInteger(chainIdNumber) || chainIdNumber !== TEMPO_CHAIN_ID) {
            return NextResponse.json(
                { error: "Invalid chain ID. Must be 42431 (Tempo Testnet)" },
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

        // On Tempo, we skip EAS attestation checks (EAS not available on Tempo)
        // Instead, we verify that the wallet is a known freelancer or company member
        const zeroBytes32 = "0x0000000000000000000000000000000000000000000000000000000000000000" as Hex;
        const requiredSchemaUID: Hex = zeroBytes32;
        const attestationUID: Hex = zeroBytes32;

        // Check if it's a freelancer or company wallet
        const freelancer = await prisma.freelancer.findFirst({
            where: { walletAddress: normalizedWallet },
        });

        const companyRole = await prisma.companyWalletRole.findFirst({
            where: {
                walletAddress: normalizedWallet,
                chainId: chainIdNumber,
                revokedAt: null,
            },
        });

        if (!freelancer && !companyRole) {
            return NextResponse.json(
                { error: "No registered user found. Please complete registration first." },
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
        ${chainIdNumber}, 
        COALESCE((SELECT MAX("nonce") FROM "PermitNonce" WHERE "subjectAddress" = ${normalizedWallet} AND "chainId" = ${chainIdNumber}), 0) + 1,
        ${action},
        NOW()
      RETURNING "nonce"
    `;

        const nonce = nonceResult[0].nonce;

        // Get contract address
        let contractAddress: Hex;
        try {
            contractAddress = getGatedActionsAddress(chainIdNumber);
        } catch {
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
            attestationUID,
            chainIdNumber,
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
                    chainId: chainIdNumber,
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
            chainId: chainIdNumber,
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
