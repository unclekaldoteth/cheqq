import { NextResponse } from 'next/server';

// Force dynamic rendering - prevents build-time analysis
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/offramp - Get quote for off-ramp
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const inputCurrency = searchParams.get('inputCurrency')?.trim().toUpperCase() || 'USDC';
        const outputCurrencyParam = searchParams.get('outputCurrency');
        const outputCurrency = outputCurrencyParam?.trim().toUpperCase() || 'IDR';

        const { getOffRampQuote, getSupportedOutputCurrencies } = await import('@/lib/offramp');

        // If no output currency, return supported options
        if (!outputCurrencyParam) {
            const supportedOutputs = getSupportedOutputCurrencies(inputCurrency);
            return NextResponse.json({
                inputCurrency,
                supportedOutputCurrencies: supportedOutputs,
            });
        }

        const inputAmount = searchParams.get('amount')?.trim();
        if (!inputAmount) {
            return NextResponse.json(
                { error: 'Amount is required' },
                { status: 400 }
            );
        }

        const amount = parseFloat(inputAmount);
        if (!Number.isFinite(amount) || amount <= 0) {
            return NextResponse.json(
                { error: 'Amount must be greater than zero' },
                { status: 400 }
            );
        }

        const quote = await getOffRampQuote(inputAmount, inputCurrency, outputCurrency);

        return NextResponse.json({ quote });
    } catch (error) {
        console.error('Failed to get off-ramp quote:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to get quote' },
            { status: 500 }
        );
    }
}

// POST /api/offramp - Initiate off-ramp transaction
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const freelancerId = String(body.freelancerId || '').trim();
        const inputAmount = String(body.amount || '').trim();
        const inputCurrency = String(body.inputCurrency || 'USDC').trim().toUpperCase();
        const outputCurrency = String(body.outputCurrency || 'IDR').trim().toUpperCase();
        const bankName = String(body.bankName || '').trim();
        const accountNumber = String(body.accountNumber || '').trim();
        const accountName = String(body.accountName || '').trim();
        const swiftCode = body.swiftCode ? String(body.swiftCode).trim() : undefined;

        // Validation
        if (!freelancerId) {
            return NextResponse.json(
                { error: 'Freelancer ID is required' },
                { status: 400 }
            );
        }

        const amount = parseFloat(inputAmount);
        if (!Number.isFinite(amount) || amount <= 0) {
            return NextResponse.json(
                { error: 'Amount must be greater than zero' },
                { status: 400 }
            );
        }

        const { validateBankDetails, initiateOffRamp, getOffRampQuote } = await import('@/lib/offramp');

        // Validate bank details
        const bankValidation = validateBankDetails({ bankName, accountNumber, accountName });
        if (!bankValidation.valid) {
            return NextResponse.json(
                { error: 'Invalid bank details', errors: bankValidation.errors },
                { status: 400 }
            );
        }

        // Get quote first
        const quote = await getOffRampQuote(inputAmount, inputCurrency, outputCurrency);

        // Initiate off-ramp
        const transaction = await initiateOffRamp(
            freelancerId,
            inputAmount,
            inputCurrency,
            outputCurrency,
            { bankName, accountNumber, accountName, swiftCode }
        );

        return NextResponse.json({
            success: true,
            transaction,
            quote,
            message: 'Off-ramp initiated. Funds will be transferred to your bank within 1-3 business days.',
        });
    } catch (error) {
        console.error('Failed to initiate off-ramp:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to initiate off-ramp' },
            { status: 500 }
        );
    }
}
