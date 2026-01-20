import { NextResponse } from 'next/server';

// Force dynamic rendering - prevents build-time analysis
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/auth/wallet?address=0x... - Check if wallet is registered
export async function GET(request: Request) {
    try {
        // Dynamic import to avoid build-time Prisma initialization
        const { getPrisma } = await import('@/lib/prisma');
        const prisma = getPrisma();

        const { searchParams } = new URL(request.url);
        const address = searchParams.get('address')?.toLowerCase();

        if (!address) {
            return NextResponse.json(
                { error: 'Wallet address is required' },
                { status: 400 }
            );
        }

        // Check if wallet belongs to a company
        const company = await prisma.company.findFirst({
            where: {
                walletAddress: {
                    mode: 'insensitive',
                    equals: address
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
        });

        if (company) {
            return NextResponse.json({
                registered: true,
                type: 'company',
                user: company,
                redirectTo: '/dashboard',
            });
        }

        // Check if wallet belongs to a freelancer
        const freelancer = await prisma.freelancer.findFirst({
            where: {
                walletAddress: {
                    mode: 'insensitive',
                    equals: address
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
        });

        if (freelancer) {
            return NextResponse.json({
                registered: true,
                type: 'freelancer',
                user: freelancer,
                redirectTo: '/freelancer/dashboard',
            });
        }

        // Wallet not registered
        return NextResponse.json({
            registered: false,
            redirectTo: '/get-started',
        });
    } catch (error) {
        console.error('Wallet auth check failed:', error);
        return NextResponse.json(
            { error: 'Authentication check failed' },
            { status: 500 }
        );
    }
}
