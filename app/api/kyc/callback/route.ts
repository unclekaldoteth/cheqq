/**
 * KYC Callback API Route
 * Processes KYC submission and stores credentials
 * Updated for Tempo Testnet - EAS attestations removed
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
    computeFreelancerKYCDataRoot,
    generateSalt,
    type FreelancerKYCData
} from "@/lib/dataRoot";
import { keccak256, type Hex } from "viem";

// KYC expiry: 1 year from now
const KYC_EXPIRY_SECONDS = 365 * 24 * 60 * 60;

// Tempo Testnet chain ID
const TEMPO_CHAIN_ID = 42431;

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        const sessionId = formData.get("sessionId") as string;
        const fullName = formData.get("fullName") as string;
        const phone = formData.get("phone") as string;
        const country = formData.get("country") as string;
        const idType = formData.get("idType") as string;
        const idNumber = formData.get("idNumber") as string;
        const document = formData.get("document") as File | null;

        // Validate required fields
        if (!sessionId || !fullName || !phone || !country || !idType || !idNumber) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Verify session exists
        const sessionLog = await prisma.auditLog.findFirst({
            where: {
                eventType: "kyc_session_started",
                metadata: {
                    path: ["sessionId"],
                    equals: sessionId,
                },
            },
        });

        if (!sessionLog || !sessionLog.metadata) {
            return NextResponse.json(
                { error: "Invalid or expired session" },
                { status: 400 }
            );
        }

        const metadata = sessionLog.metadata as { freelancerId: string; email: string };
        const freelancerId = metadata.freelancerId;
        const walletAddress = sessionLog.subjectAddress as Hex;

        // Get or create salt
        let salt = await prisma.kycSalt.findUnique({
            where: {
                subjectType_subjectId: {
                    subjectType: "FREELANCER",
                    subjectId: freelancerId,
                },
            },
        });

        if (!salt) {
            salt = await prisma.kycSalt.create({
                data: {
                    subjectType: "FREELANCER",
                    subjectId: freelancerId,
                    saltNonce: 1,
                },
            });
        } else {
            salt = await prisma.kycSalt.update({
                where: { id: salt.id },
                data: { saltNonce: salt.saltNonce + 1 },
            });
        }

        // Compute document hash (or placeholder if no document)
        let docHash: Hex = "0x0000000000000000000000000000000000000000000000000000000000000000";
        if (document) {
            const docBuffer = await document.arrayBuffer();
            docHash = keccak256(new Uint8Array(docBuffer));
        }

        // Generate salt and compute dataRoot
        const kycSalt = generateSalt(walletAddress, salt.saltNonce);

        const kycData: FreelancerKYCData = {
            fullName,
            email: metadata.email,
            phone,
            country,
            idType,
            idNumber,
            docHash,
        };

        const dataRoot = computeFreelancerKYCDataRoot(kycData, kycSalt);

        // Calculate expiry
        const expiresAt = new Date(Date.now() + KYC_EXPIRY_SECONDS * 1000);

        // Use Tempo chain ID
        const chainId = TEMPO_CHAIN_ID;

        // Store KYC credential (without EAS attestation on Tempo)
        await prisma.kycCredential.upsert({
            where: {
                freelancerId_chainId: {
                    freelancerId,
                    chainId,
                },
            },
            create: {
                freelancerId,
                walletAddress,
                level: 1,
                dataRoot,
                attestationUid: null,
                chainId,
                expiresAt,
                provider: "MANUAL",
            },
            update: {
                level: 1,
                dataRoot,
                attestationUid: null,
                expiresAt,
                revokedAt: null,
            },
        });

        // Log completion
        await prisma.auditLog.create({
            data: {
                eventType: "kyc_submitted",
                subjectAddress: walletAddress,
                action: "kyc_callback",
                metadata: {
                    sessionId,
                    freelancerId,
                    chainId,
                    note: "EAS attestation not available on Tempo",
                },
            },
        });

        return NextResponse.json({
            success: true,
            expiresAt: expiresAt.toISOString(),
            level: 1,
            status: "verified",
        });
    } catch (error) {
        console.error("KYC callback error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
