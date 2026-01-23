import { NextResponse } from 'next/server';

// Force dynamic rendering - prevents build-time analysis
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/companies - List all companies
export async function GET() {
    try {
        const { getPrisma } = await import('@/lib/prisma');
        const prisma = getPrisma();

        const companies = await prisma.company.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ companies });
    } catch (error) {
        console.error('Failed to fetch companies:', error);
        return NextResponse.json(
            { error: 'Failed to fetch companies' },
            { status: 500 }
        );
    }
}

// POST /api/companies - Register a company
export async function POST(request: Request) {
    try {
        const { getPrisma } = await import('@/lib/prisma');
        const prisma = getPrisma();

        const body = await request.json();
        const name = String(body.companyName || body.name || '').trim();
        const email = String(body.email || '').trim().toLowerCase();
        const walletAddress = String(body.walletAddress || '').trim().toLowerCase();

        if (!name || !email || !walletAddress) {
            return NextResponse.json(
                { error: 'Company name, email, and wallet address are required' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Validate wallet address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
            return NextResponse.json(
                { error: 'Invalid wallet address format' },
                { status: 400 }
            );
        }

        // Check if wallet is already registered as company
        const existingCompany = await prisma.company.findFirst({
            where: {
                walletAddress: walletAddress,
            },
            select: { id: true },
        });

        if (existingCompany) {
            return NextResponse.json(
                { error: 'This wallet is already registered to a company' },
                { status: 409 }
            );
        }

        // Check if wallet is already registered as freelancer
        const existingFreelancer = await prisma.freelancer.findFirst({
            where: {
                walletAddress: walletAddress,
            },
            select: { id: true },
        });

        if (existingFreelancer) {
            return NextResponse.json(
                { error: 'This wallet is already registered to a freelancer' },
                { status: 409 }
            );
        }

        // Check if email is already used
        const existingEmail = await prisma.company.findFirst({
            where: {
                email: email,
            },
            select: { id: true },
        });

        if (existingEmail) {
            return NextResponse.json(
                { error: 'This email is already registered' },
                { status: 409 }
            );
        }

        // Create company
        const company = await prisma.company.create({
            data: {
                name,
                email,
                walletAddress,
                logo: body.logo || null,
            },
        });

        return NextResponse.json({
            company,
            message: 'Company registered successfully',
        });
    } catch (error: unknown) {
        // Check for unique constraint violation (P2002)
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
            const target = 'meta' in error && error.meta && typeof error.meta === 'object' && 'target' in error.meta
                ? (error.meta.target as string[])
                : [];

            if (target.includes('email')) {
                return NextResponse.json(
                    { error: 'This email is already registered' },
                    { status: 409 }
                );
            }
            if (target.includes('walletAddress')) {
                return NextResponse.json(
                    { error: 'This wallet is already registered' },
                    { status: 409 }
                );
            }
            return NextResponse.json(
                { error: 'A company with these details already exists' },
                { status: 409 }
            );
        }

        console.error('Failed to register company:', error);
        return NextResponse.json(
            { error: 'Failed to register company. Please try again.' },
            { status: 500 }
        );
    }
}
