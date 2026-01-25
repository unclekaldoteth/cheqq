/**
 * KYB Callback API Route
 * Processes KYB submission, creates attestations for company and initial owner role
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
    computeCompanyKYBDataRoot,
    computeCompanyId,
    generateSalt,
    type CompanyKYBData
} from "@/lib/dataRoot";
import {
    createCompanyKYBAttestation,
    createCompanyRoleAttestation,
    type CompanyKYBAttestationData,
    type CompanyRoleAttestationData,
} from "@/lib/eas";
import { keccak256, type Hex } from "viem";

// KYB expiry: 1 year from now
const KYB_EXPIRY_SECONDS = 365 * 24 * 60 * 60;

// Role constants
const ROLE_OWNER = 1;

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
        const expiresAtUnix = BigInt(Math.floor(expiresAt.getTime() / 1000));

        // Get chain ID from environment
        const chainId = process.env.NEXT_PUBLIC_CHAIN === "base" ? 8453 : 84532;

        // Create EAS attestations
        let kybAttestationUID: Hex | null = null;
        let ownerRoleAttestationUID: Hex | null = null;
        let kybTxHash: Hex | null = null;
        let roleTxHash: Hex | null = null;

        try {
            // 1. Create KYB attestation
            const kybAttestation: CompanyKYBAttestationData = {
                companyId: companyHash,
                level: 1,
                expiresAt: expiresAtUnix,
                dataRoot,
            };

            const kybResult = await createCompanyKYBAttestation(kybAttestation, chainId);
            kybAttestationUID = kybResult.attestationUID;
            kybTxHash = kybResult.txHash;

            // 2. Create owner role attestation (linked to KYB)
            if (kybAttestationUID) {
                const roleData: CompanyRoleAttestationData = {
                    companyId: companyHash,
                    role: ROLE_OWNER,
                };

                const roleResult = await createCompanyRoleAttestation(
                    walletAddress,
                    roleData,
                    kybAttestationUID,
                    chainId
                );
                ownerRoleAttestationUID = roleResult.attestationUID;
                roleTxHash = roleResult.txHash;
            }
        } catch (attestError) {
            console.error("EAS attestation failed:", attestError);
            // Continue without attestation - will be retried
        }

        // Store KYB credential
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
                attestationUid: kybAttestationUID,
                chainId,
                expiresAt,
                provider: "MANUAL",
            },
            update: {
                companyHash,
                level: 1,
                dataRoot,
                attestationUid: kybAttestationUID,
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
                attestationUid: ownerRoleAttestationUID,
                chainId,
                grantedBy: walletAddress,
            },
            update: {
                role: "OWNER",
                attestationUid: ownerRoleAttestationUID,
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
                    kybAttestationUID,
                    ownerRoleAttestationUID,
                    kybTxHash,
                    roleTxHash,
                    chainId,
                },
            },
        });

        return NextResponse.json({
            success: true,
            kybAttestationUID,
            ownerRoleAttestationUID,
            companyHash,
            kybTxHash,
            roleTxHash,
            expiresAt: expiresAt.toISOString(),
            level: 1,
            status: kybAttestationUID ? "attested" : "pending_attestation",
        });
    } catch (error) {
        console.error("KYB callback error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
