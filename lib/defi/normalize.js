'use strict';

const toNumber = (value) => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (typeof value === 'string') {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
};

const normalizeDate = (value) => {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '-';
    return parsed.toISOString();
};

const normalizeTreasuryResponse = (treasuryData) => {
    const data = treasuryData && typeof treasuryData === 'object' ? treasuryData : {};
    const balances = Array.isArray(data.balances) ? data.balances : [];
    const summary = data.summary && typeof data.summary === 'object' ? data.summary : {};

    return {
        balances: balances.map((balance) => ({
            id: balance?.id || '',
            currency: balance?.currency || 'AlphaUSD',
            balance: toNumber(balance?.balance),
            yieldEarned: toNumber(balance?.yieldEarned),
        })),
        summary: {
            totalBalance: toNumber(summary.totalBalance),
            totalYield: toNumber(summary.totalYield),
            currencies: toNumber(summary.currencies),
        },
    };
};

const normalizeLoansResponse = (loansData) => {
    const data = loansData && typeof loansData === 'object' ? loansData : {};
    const loans = Array.isArray(data.loans) ? data.loans : [];
    const summary = data.summary && typeof data.summary === 'object' ? data.summary : null;

    return {
        loans: loans.map((loan) => ({
            id: loan?.id || '',
            amount: toNumber(loan?.amount),
            remainingAmount: toNumber(loan?.remainingAmount),
            monthlyDeduction: toNumber(loan?.monthlyDeduction),
            currency: loan?.currency || 'AlphaUSD',
            status: loan?.status || 'ACTIVE',
            createdAt: loan?.createdAt || '',
            employee: {
                id: loan?.employee?.id || '',
                name: loan?.employee?.name || 'Employee',
                email: loan?.employee?.email || '',
            },
        })),
        summary: summary
            ? {
                total: toNumber(summary.total),
                totalAmount: toNumber(summary.totalAmount),
                totalRemaining: toNumber(summary.totalRemaining),
                active: toNumber(summary.active),
                pending: toNumber(summary.pending),
            }
            : null,
    };
};

module.exports = {
    toNumber,
    normalizeDate,
    normalizeTreasuryResponse,
    normalizeLoansResponse,
};
