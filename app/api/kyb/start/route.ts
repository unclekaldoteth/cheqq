/**
 * KYB Start API Route
 * Initiates KYB verification for companies
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { walletAddress, companyName, businessEmail } = body;

        // Validate inputs
        if (!walletAddress || typeof walletAddress !== "string") {
            return NextResponse.json(
                { error: "Invalid wallet address" },
                { status: 400 }
            );
        }

        if (!companyName || typeof companyName !== "string") {
            return NextResponse.json(
                { error: "Invalid company name" },
                { status: 400 }
            );
        }

        if (!businessEmail || typeof businessEmail !== "string" || !businessEmail.includes("@")) {
            return NextResponse.json(
                { error: "Invalid business email" },
                { status: 400 }
            );
        }

        const normalizedWallet = walletAddress.toLowerCase();

        // Check if company exists
        const company = await prisma.company.findFirst({
            where: {
                OR: [
                    { email: businessEmail.toLowerCase() },
                    { walletAddress: normalizedWallet },
                ]
            },
            include: {
                kybCredentials: {
                    where: { revokedAt: null },
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
            },
        });

        if (!company) {
            return NextResponse.json(
                { error: "Company not found. Please register first." },
                { status: 404 }
            );
        }

        // Check if already has valid KYB
        const existingKyb = company.kybCredentials[0];
        if (existingKyb && existingKyb.expiresAt > new Date()) {
            return NextResponse.json(
                {
                    error: "Active KYB credential exists",
                    attestationUID: existingKyb.attestationUid,
                    expiresAt: existingKyb.expiresAt,
                },
                { status: 409 }
            );
        }

        // Generate session ID
        const sessionId = randomUUID();

        // Store session in audit log
        await prisma.auditLog.create({
            data: {
                eventType: "kyb_session_started",
                subjectAddress: normalizedWallet,
                action: "kyb_start",
                metadata: {
                    sessionId,
                    companyId: company.id,
                    companyName,
                    businessEmail,
                },
            },
        });

        return NextResponse.json({
            sessionId,
            companyId: company.id,
            requiredFields: [
                "registrationNumber",
                "businessAddress",
                "phone",
                "country",
            ],
            uploadUrl: "/api/kyb/callback",
            provider: "MANUAL",
        });
    } catch (error) {
        console.error("KYB start error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
