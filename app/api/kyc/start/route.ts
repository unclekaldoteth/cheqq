/**
 * KYC Start API Route
 * Initiates KYC verification for freelancers
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { walletAddress, email } = body;

        // Validate inputs
        if (!walletAddress || typeof walletAddress !== "string") {
            return NextResponse.json(
                { error: "Invalid wallet address" },
                { status: 400 }
            );
        }

        if (!email || typeof email !== "string" || !email.includes("@")) {
            return NextResponse.json(
                { error: "Invalid email address" },
                { status: 400 }
            );
        }

        const normalizedWallet = walletAddress.toLowerCase();

        // Check if freelancer exists
        const freelancer = await prisma.freelancer.findFirst({
            where: { walletAddress: normalizedWallet },
            include: {
                kycCredentials: {
                    where: { revokedAt: null },
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
            },
        });

        if (!freelancer) {
            return NextResponse.json(
                { error: "Freelancer not found. Please register first." },
                { status: 404 }
            );
        }

        // Check if already has valid KYC
        const existingKyc = freelancer.kycCredentials[0];
        if (existingKyc && existingKyc.expiresAt > new Date()) {
            return NextResponse.json(
                {
                    error: "Active KYC credential exists",
                    attestationUID: existingKyc.attestationUid,
                    expiresAt: existingKyc.expiresAt,
                },
                { status: 409 }
            );
        }

        // Generate session ID
        const sessionId = randomUUID();

        // Store session in audit log
        await prisma.auditLog.create({
            data: {
                eventType: "kyc_session_started",
                subjectAddress: normalizedWallet,
                action: "kyc_start",
                metadata: {
                    sessionId,
                    email,
                    freelancerId: freelancer.id,
                },
            },
        });

        return NextResponse.json({
            sessionId,
            freelancerId: freelancer.id,
            requiredFields: [
                "fullName",
                "phone",
                "country",
                "idType",
                "idNumber",
            ],
            uploadUrl: "/api/kyc/callback",
            provider: "MANUAL",
        });
    } catch (error) {
        console.error("KYC start error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
