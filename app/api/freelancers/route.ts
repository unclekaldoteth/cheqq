import { NextResponse } from 'next/server';

// Force dynamic rendering - prevents build-time analysis
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/freelancers - List all freelancers
export async function GET() {
    try {
        const { getPrisma } = await import('@/lib/prisma');
        const prisma = getPrisma();

        const freelancers = await prisma.freelancer.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ freelancers });
    } catch (error) {
        console.error('Failed to fetch freelancers:', error);
        return NextResponse.json(
            { error: 'Failed to fetch freelancers' },
            { status: 500 }
        );
    }
}

// POST /api/freelancers - Register a freelancer
export async function POST(request: Request) {
    try {
        const { getPrisma } = await import('@/lib/prisma');
        const prisma = getPrisma();

        const body = await request.json();
        const name = String(body.fullName || body.name || '').trim();
        const email = String(body.email || '').trim().toLowerCase();
        const walletAddress = String(body.walletAddress || '').trim().toLowerCase();

        if (!name || !email || !walletAddress) {
            return NextResponse.json(
                { error: 'Full name, email, and wallet address are required' },
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

        // Check if wallet is already registered as freelancer
        const existingFreelancer = await prisma.freelancer.findFirst({
            where: {
                walletAddress: walletAddress,
            },
            select: { id: true },
        });

        if (existingFreelancer) {
            return NextResponse.json(
                { error: 'This wallet is already registered as a freelancer' },
                { status: 409 }
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

        // Check if email is already used
        const existingEmail = await prisma.freelancer.findFirst({
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

        // Create freelancer
        const freelancer = await prisma.freelancer.create({
            data: {
                name,
                email,
                walletAddress,
            },
        });

        return NextResponse.json({
            freelancer,
            message: 'Freelancer registered successfully',
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
                { error: 'A freelancer with these details already exists' },
                { status: 409 }
            );
        }

        console.error('Failed to register freelancer:', error);
        return NextResponse.json(
            { error: 'Failed to register freelancer. Please try again.' },
            { status: 500 }
        );
    }
}
