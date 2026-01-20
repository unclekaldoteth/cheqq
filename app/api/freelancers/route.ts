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
        const name = body.fullName || body.name;
        const email = body.email;
        const walletAddress = body.walletAddress;

        if (!name || !email || !walletAddress) {
            return NextResponse.json(
                { error: 'Full name, email, and wallet address are required' },
                { status: 400 }
            );
        }

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
            return NextResponse.json(
                { error: 'A freelancer with this email already exists' },
                { status: 409 }
            );
        }

        console.error('Failed to register freelancer:', error);
        return NextResponse.json(
            { error: 'Failed to register freelancer' },
            { status: 500 }
        );
    }
}
