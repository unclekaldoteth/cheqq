import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const jsonNoStore = (body: unknown, init?: ResponseInit) =>
    NextResponse.json(body, {
        ...init,
        headers: {
            'Cache-Control': 'no-store',
            ...(init?.headers ?? {}),
        },
    });

// GET /api/user?wallet=0x... - Get user (company or freelancer) by wallet address
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const wallet = searchParams.get('wallet')?.trim().toLowerCase();

        if (!wallet) {
            return jsonNoStore(
                { error: 'Wallet address is required' },
                { status: 400 }
            );
        }

        // Validate wallet format
        if (!/^0x[a-f0-9]{40}$/.test(wallet)) {
            return jsonNoStore(
                { error: 'Invalid wallet address format' },
                { status: 400 }
            );
        }

        const { getPrisma } = await import('@/lib/prisma');
        const prisma = getPrisma();

        // Check for company first
        const company = await prisma.company.findFirst({
            where: {
                walletAddress: {
                    equals: wallet,
                    mode: 'insensitive',
                },
            },
            select: {
                id: true,
                name: true,
                email: true,
                walletAddress: true,
                logo: true,
                createdAt: true,
            },
        });

        if (company) {
            return jsonNoStore({
                type: 'company',
                data: company,
            });
        }

        // Check for freelancer
        const freelancer = await prisma.freelancer.findFirst({
            where: {
                walletAddress: {
                    equals: wallet,
                    mode: 'insensitive',
                },
            },
            select: {
                id: true,
                name: true,
                email: true,
                walletAddress: true,
                profession: true,
                bio: true,
                reputationScore: true,
                createdAt: true,
            },
        });

        if (freelancer) {
            return jsonNoStore({
                type: 'freelancer',
                data: freelancer,
            });
        }

        // No user found
        return jsonNoStore(
            { error: 'User not found', type: null, data: null },
            { status: 404 }
        );
    } catch (error) {
        console.error('Failed to fetch user:', error);
        return jsonNoStore(
            { error: 'Failed to fetch user' },
            { status: 500 }
        );
    }
}
