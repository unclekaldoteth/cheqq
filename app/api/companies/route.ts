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
        const email = String(body.email || '').trim();
        const walletAddress = String(body.walletAddress || '').trim();

        if (!name || !email || !walletAddress) {
            return NextResponse.json(
                { error: 'Company name, email, and wallet address are required' },
                { status: 400 }
            );
        }

        const existingCompany = await prisma.company.findFirst({
            where: {
                walletAddress: {
                    mode: 'insensitive',
                    equals: walletAddress,
                },
            },
            select: { id: true },
        });

        if (existingCompany) {
            return NextResponse.json(
                { error: 'This wallet is already registered to a company' },
                { status: 409 }
            );
        }

        const existingFreelancer = await prisma.freelancer.findFirst({
            where: {
                walletAddress: {
                    mode: 'insensitive',
                    equals: walletAddress,
                },
            },
            select: { id: true },
        });

        if (existingFreelancer) {
            return NextResponse.json(
                { error: 'This wallet is already registered to a freelancer' },
                { status: 409 }
            );
        }

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
            return NextResponse.json(
                { error: 'A company with this email already exists' },
                { status: 409 }
            );
        }

        console.error('Failed to register company:', error);
        return NextResponse.json(
            { error: 'Failed to register company' },
            { status: 500 }
        );
    }
}
