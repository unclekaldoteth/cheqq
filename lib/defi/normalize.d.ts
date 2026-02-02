export interface TreasuryBalance {
    id: string;
    currency: string;
    balance: number;
    yieldEarned: number;
}

export interface TreasuryData {
    balances: TreasuryBalance[];
    summary: {
        totalBalance: number;
        totalYield: number;
        currencies: number;
    };
}

export interface Loan {
    id: string;
    amount: number;
    remainingAmount: number;
    monthlyDeduction: number;
    currency: string;
    status: string;
    createdAt: string;
    employee: {
        id: string;
        name: string;
        email: string;
    };
}

export interface LoansSummary {
    total: number;
    totalAmount: number;
    totalRemaining: number;
    active: number;
    pending: number;
}

export function toNumber(value: unknown): number;
export function normalizeDate(value?: string): string;
export function normalizeTreasuryResponse(treasuryData: unknown): TreasuryData;
export function normalizeLoansResponse(loansData: unknown): {
    loans: Loan[];
    summary: LoansSummary | null;
};
