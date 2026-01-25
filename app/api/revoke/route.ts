/**
 * Revoke API Route
 * Admin endpoint to block subjects and revoke attestations
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revokeAttestation, SCHEMA_UIDS } from "@/lib/eas";
import { type Hex } from "viem";

// Admin wallets (should be in environment variable in production)
const ADMIN_WALLETS = [
    process.env.ADMIN_WALLET_1?.toLowerCase(),
    process.env.ADMIN_WALLET_2?.toLowerCase(),
].filter(Boolean);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            adminWallet,
            subjectAddress,
            reason,
            revokeAttestations = false,
            blockedUntil = null, // null = permanent
        } = body;

        // Validate admin
        if (!adminWallet || !ADMIN_WALLETS.includes(adminWallet.toLowerCase())) {
            return NextResponse.json(
                { error: "Unauthorized. Admin access required." },
                { status: 401 }
            );
        }

        // Validate inputs
        if (!subjectAddress || typeof subjectAddress !== "string") {
            return NextResponse.json(
                { error: "Invalid subject address" },
                { status: 400 }
            );
        }

        if (!reason || typeof reason !== "string") {
            return NextResponse.json(
                { error: "Reason is required" },
                { status: 400 }
            );
        }

        const normalizedSubject = subjectAddress.toLowerCase();
        const normalizedAdmin = adminWallet.toLowerCase();

        // Block the subject
        await prisma.blockedSubject.upsert({
            where: { subjectAddress: normalizedSubject },
            create: {
                subjectAddress: normalizedSubject,
                reason,
                blockedBy: normalizedAdmin,
                blockedUntil: blockedUntil ? new Date(blockedUntil) : null,
            },
            update: {
                reason,
                blockedBy: normalizedAdmin,
                blockedUntil: blockedUntil ? new Date(blockedUntil) : null,
            },
        });

        const revokedAttestations: string[] = [];
        const chainId = process.env.NEXT_PUBLIC_CHAIN === "base" ? 8453 : 84532;
        const schemaUIDs = chainId === 8453 ? SCHEMA_UIDS.base : SCHEMA_UIDS.baseSepolia;

        if (revokeAttestations) {
            // Revoke KYC credentials
            const kycCredentials = await prisma.kycCredential.findMany({
                where: {
                    walletAddress: normalizedSubject,
                    revokedAt: null,
                    attestationUid: { not: null },
                },
            });

            for (const kyc of kycCredentials) {
                if (kyc.attestationUid) {
                    try {
                        await revokeAttestation(
                            kyc.attestationUid as Hex,
                            schemaUIDs.freelancerKYC,
                            kyc.chainId
                        );
                        revokedAttestations.push(kyc.attestationUid);
                    } catch (e) {
                        console.error(`Failed to revoke KYC attestation ${kyc.attestationUid}:`, e);
                    }

                    await prisma.kycCredential.update({
                        where: { id: kyc.id },
                        data: { revokedAt: new Date() },
                    });
                }
            }

            // Revoke company roles
            const companyRoles = await prisma.companyWalletRole.findMany({
                where: {
                    walletAddress: normalizedSubject,
                    revokedAt: null,
                    attestationUid: { not: null },
                },
            });

            for (const role of companyRoles) {
                if (role.attestationUid) {
                    try {
                        await revokeAttestation(
                            role.attestationUid as Hex,
                            schemaUIDs.companyRole,
                            role.chainId
                        );
                        revokedAttestations.push(role.attestationUid);
                    } catch (e) {
                        console.error(`Failed to revoke role attestation ${role.attestationUid}:`, e);
                    }

                    await prisma.companyWalletRole.update({
                        where: { id: role.id },
                        data: { revokedAt: new Date() },
                    });
                }
            }
        }

        // Log the action
        await prisma.auditLog.create({
            data: {
                eventType: "subject_blocked",
                subjectAddress: normalizedSubject,
                action: "revoke",
                metadata: {
                    reason,
                    blockedBy: normalizedAdmin,
                    blockedUntil,
                    revokedAttestations,
                },
            },
        });

        return NextResponse.json({
            success: true,
            blocked: true,
            reason,
            blockedUntil: blockedUntil || "permanent",
            revokedAttestations,
        });
    } catch (error) {
        console.error("Revoke error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
