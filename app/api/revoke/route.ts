/**
 * Revoke API Route
 * Admin endpoint to block subjects and revoke credentials
 * Updated for Tempo Testnet - EAS attestation revocation removed
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
            revokeCredentials = false,
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

        const revokedCredentials: string[] = [];

        if (revokeCredentials) {
            // Revoke KYC credentials (database-level only, no on-chain attestation on Tempo)
            const kycCredentials = await prisma.kycCredential.findMany({
                where: {
                    walletAddress: normalizedSubject,
                    revokedAt: null,
                },
            });

            for (const kyc of kycCredentials) {
                await prisma.kycCredential.update({
                    where: { id: kyc.id },
                    data: { revokedAt: new Date() },
                });
                revokedCredentials.push(`kyc:${kyc.id}`);
            }

            // Revoke company roles
            const companyRoles = await prisma.companyWalletRole.findMany({
                where: {
                    walletAddress: normalizedSubject,
                    revokedAt: null,
                },
            });

            for (const role of companyRoles) {
                await prisma.companyWalletRole.update({
                    where: { id: role.id },
                    data: { revokedAt: new Date() },
                });
                revokedCredentials.push(`role:${role.id}`);
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
                    revokedCredentials,
                },
            },
        });

        return NextResponse.json({
            success: true,
            blocked: true,
            reason,
            blockedUntil: blockedUntil || "permanent",
            revokedCredentials,
        });
    } catch (error) {
        console.error("Revoke error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
