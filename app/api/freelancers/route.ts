import { NextResponse } from 'next/server';
import { isFile, uploadDocumentToSupabase, validateDocumentFile } from '@/lib/storage';

// Force dynamic rendering - prevents build-time analysis
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type BodyRecord = Record<string, unknown>;

const parseRequestBody = async (request: Request): Promise<BodyRecord> => {
    const contentType = request.headers.get('content-type') ?? '';
    if (contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        const data: BodyRecord = {};
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        return data;
    }

    try {
        return await request.json();
    } catch {
        return {};
    }
};

const readStringField = (body: BodyRecord, key: string): string => {
    const value = body[key];
    return typeof value === 'string' ? value : '';
};

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

        const body = await parseRequestBody(request);
        const name = (readStringField(body, 'fullName') || readStringField(body, 'name')).trim();
        const email = readStringField(body, 'email').trim().toLowerCase();
        const walletAddress = readStringField(body, 'walletAddress').trim().toLowerCase();
        const idDocument = body.idDocument;

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
        if (!/^0x[a-f0-9]{40}$/.test(walletAddress)) {
            return NextResponse.json(
                { error: 'Invalid wallet address format' },
                { status: 400 }
            );
        }

        const [existingFreelancer, existingCompany, existingEmail] = await Promise.all([
            prisma.freelancer.findFirst({
                where: {
                    walletAddress: walletAddress,
                },
                select: { id: true },
            }),
            prisma.company.findFirst({
                where: {
                    walletAddress: walletAddress,
                },
                select: { id: true },
            }),
            prisma.freelancer.findFirst({
                where: {
                    email: email,
                },
                select: { id: true },
            }),
        ]);

        if (existingFreelancer) {
            return NextResponse.json(
                { error: 'This wallet is already registered as a freelancer' },
                { status: 409 }
            );
        }

        if (existingCompany) {
            return NextResponse.json(
                { error: 'This wallet is already registered to a company' },
                { status: 409 }
            );
        }

        if (existingEmail) {
            return NextResponse.json(
                { error: 'This email is already registered' },
                { status: 409 }
            );
        }

        let idDocumentUrl: string | null = null;
        if (isFile(idDocument) && idDocument.size > 0) {
            try {
                validateDocumentFile(idDocument);
                const upload = await uploadDocumentToSupabase(idDocument, {
                    folder: 'freelancers',
                    ownerKey: walletAddress,
                });
                idDocumentUrl = upload.publicUrl;
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Invalid document upload.';
                const isValidationError = message.startsWith('Unsupported document type')
                    || message.startsWith('Document size exceeds');
                if (!isValidationError) {
                    console.error('Document upload failed:', error);
                }
                return NextResponse.json(
                    { error: isValidationError ? message : 'Failed to upload document.' },
                    { status: isValidationError ? 400 : 500 }
                );
            }
        }

        // Create freelancer
        const freelancer = await prisma.freelancer.create({
            data: {
                name,
                email,
                walletAddress,
                idDocumentUrl,
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
