/**
 * KYB Callback API Route
 * Processes KYB submission and stores company credentials
 * Updated for Tempo Testnet - EAS attestations removed
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
    computeCompanyKYBDataRoot,
    computeCompanyId,
    generateSalt,
    type CompanyKYBData
} from "@/lib/dataRoot";
import { keccak256, type Hex } from "viem";

// KYB expiry: 1 year from now
const KYB_EXPIRY_SECONDS = 365 * 24 * 60 * 60;

// Tempo Testnet chain ID
const TEMPO_CHAIN_ID = 42431;

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        const sessionId = formData.get("sessionId") as string;
        const registrationNumber = formData.get("registrationNumber") as string;
        const businessAddress = formData.get("businessAddress") as string;
        const phone = formData.get("phone") as string;
        const country = formData.get("country") as string;
        const documents = formData.getAll("documents") as File[];

        // Validate required fields
        if (!sessionId || !registrationNumber || !businessAddress || !phone || !country) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Verify session exists
        const sessionLog = await prisma.auditLog.findFirst({
            where: {
                eventType: "kyb_session_started",
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

        const metadata = sessionLog.metadata as {
            companyId: string;
            companyName: string;
            businessEmail: string;
        };
        const companyId = metadata.companyId;
        const walletAddress = sessionLog.subjectAddress as Hex;

        // Get or create salt
        let salt = await prisma.kycSalt.findUnique({
            where: {
                subjectType_subjectId: {
                    subjectType: "COMPANY",
                    subjectId: companyId,
                },
            },
        });

        if (!salt) {
            salt = await prisma.kycSalt.create({
                data: {
                    subjectType: "COMPANY",
                    subjectId: companyId,
                    saltNonce: 1,
                },
            });
        } else {
            salt = await prisma.kycSalt.update({
                where: { id: salt.id },
                data: { saltNonce: salt.saltNonce + 1 },
            });
        }

        // Compute document hash
        let docHash: Hex = "0x0000000000000000000000000000000000000000000000000000000000000000";
        if (documents.length > 0) {
            const allDocBuffers = await Promise.all(
                documents.map(doc => doc.arrayBuffer())
            );
            const combined = new Uint8Array(
                allDocBuffers.reduce((acc, buf) => acc + buf.byteLength, 0)
            );
            let offset = 0;
            for (const buf of allDocBuffers) {
                combined.set(new Uint8Array(buf), offset);
                offset += buf.byteLength;
            }
            docHash = keccak256(combined);
        }

        // Generate salt and compute dataRoot
        const kybSalt = generateSalt(walletAddress, salt.saltNonce);

        const kybData: CompanyKYBData = {
            companyName: metadata.companyName,
            businessEmail: metadata.businessEmail,
            phone,
            country,
            registrationNumber,
            businessAddress,
            docHash,
        };

        const dataRoot = computeCompanyKYBDataRoot(kybData, kybSalt);
        const companyHash = computeCompanyId(metadata.companyName, registrationNumber);

        // Calculate expiry
        const expiresAt = new Date(Date.now() + KYB_EXPIRY_SECONDS * 1000);

        // Use Tempo chain ID
        const chainId = TEMPO_CHAIN_ID;

        // Store KYB credential (without EAS attestation on Tempo)
        await prisma.kybCredential.upsert({
            where: {
                companyId_chainId: {
                    companyId,
                    chainId,
                },
            },
            create: {
                companyId,
                companyHash,
                level: 1,
                dataRoot,
                attestationUid: null,
                chainId,
                expiresAt,
                provider: "MANUAL",
            },
            update: {
                companyHash,
                level: 1,
                dataRoot,
                attestationUid: null,
                expiresAt,
                revokedAt: null,
            },
        });

        // Store owner role
        await prisma.companyWalletRole.upsert({
            where: {
                companyId_walletAddress_chainId: {
                    companyId,
                    walletAddress,
                    chainId,
                },
            },
            create: {
                companyId,
                walletAddress,
                role: "OWNER",
                attestationUid: null,
                chainId,
                grantedBy: walletAddress,
            },
            update: {
                role: "OWNER",
                attestationUid: null,
                revokedAt: null,
            },
        });

        // Log completion
        await prisma.auditLog.create({
            data: {
                eventType: "kyb_submitted",
                subjectAddress: walletAddress,
                action: "kyb_callback",
                metadata: {
                    sessionId,
                    companyId,
                    companyHash,
                    chainId,
                    note: "EAS attestation not available on Tempo",
                },
            },
        });

        return NextResponse.json({
            success: true,
            companyHash,
            expiresAt: expiresAt.toISOString(),
            level: 1,
            status: "verified",
        });
    } catch (error) {
        console.error("KYB callback error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
