/**
 * KYC Status API Route
 * Returns verification status for a wallet address
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { type Hex } from "viem";

function determineStatus(
    credential: { expiresAt: Date; revokedAt: Date | null } | null
): "none" | "pending" | "verified" | "expired" | "revoked" {
    if (!credential) return "none";
    if (credential.revokedAt) return "revoked";
    if (credential.expiresAt < new Date()) return "expired";
    return "verified";
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const walletAddress = searchParams.get("walletAddress");
        const chainIdStr = searchParams.get("chainId");

        if (!walletAddress) {
            return NextResponse.json(
                { error: "Wallet address is required" },
                { status: 400 }
            );
        }

        const chainId = chainIdStr ? parseInt(chainIdStr, 10) : 84532;
        const normalizedWallet = walletAddress.toLowerCase();

        // Check if freelancer
        const freelancer = await prisma.freelancer.findFirst({
            where: { walletAddress: normalizedWallet },
            include: {
                kycCredentials: {
                    where: { chainId },
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
            },
        });

        // Check company roles
        const companyRoles = await prisma.companyWalletRole.findMany({
            where: {
                walletAddress: normalizedWallet,
                chainId,
                revokedAt: null,
            },
            include: {
                company: {
                    include: {
                        kybCredentials: {
                            where: { chainId },
                            orderBy: { createdAt: "desc" },
                            take: 1,
                        },
                    },
                },
            },
        });

        const isFreelancer = !!freelancer;
        const isCompanyMember = companyRoles.length > 0;

        // Get KYC credential status
        const kycCred = freelancer?.kycCredentials[0] || null;
        const kycCredential = kycCred
            ? {
                id: kycCred.id,
                level: kycCred.level,
                attestationUid: kycCred.attestationUid as Hex | null,
                expiresAt: kycCred.expiresAt.toISOString(),
                provider: kycCred.provider,
                status: determineStatus(kycCred),
            }
            : null;

        // Get KYB credential and roles
        let kybCredential = null;
        const roles: Array<{
            companyId: string;
            companyName: string;
            role: string;
            attestationUid: Hex | null;
        }> = [];

        for (const role of companyRoles) {
            const kybCred = role.company.kybCredentials[0];

            // Use first valid KYB
            if (!kybCredential && kybCred) {
                kybCredential = {
                    id: kybCred.id,
                    companyId: kybCred.companyId,
                    companyHash: kybCred.companyHash as Hex,
                    level: kybCred.level,
                    attestationUid: kybCred.attestationUid as Hex | null,
                    expiresAt: kybCred.expiresAt.toISOString(),
                    provider: kybCred.provider,
                    status: determineStatus(kybCred),
                };
            }

            roles.push({
                companyId: role.companyId,
                companyName: role.company.name,
                role: role.role,
                attestationUid: role.attestationUid as Hex | null,
            });
        }

        // Determine if has valid credential
        const hasValidKYC = kycCredential?.status === "verified";
        const hasValidKYB = kybCredential?.status === "verified" && roles.length > 0;
        const hasValidCredential = hasValidKYC || hasValidKYB;

        return NextResponse.json({
            isFreelancer,
            isCompanyMember,
            kycCredential,
            kybCredential,
            companyRoles: roles,
            hasValidCredential,
        });
    } catch (error) {
        console.error("KYC status error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
