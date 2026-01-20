import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/companies - List all companies
export async function GET() {
    try {
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
        const body = await request.json();
        const name = body.companyName || body.name;
        const email = body.email;

        if (!name || !email) {
            return NextResponse.json(
                { error: 'Company name and email are required' },
                { status: 400 }
            );
        }

        const company = await prisma.company.create({
            data: {
                name,
                email,
                walletAddress: body.walletAddress || null,
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
