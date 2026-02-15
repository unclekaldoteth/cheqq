import test from 'node:test';
import assert from 'node:assert/strict';
import normalizeModule from '../lib/defi/normalize.js';

const {
    toNumber,
    normalizeDate,
    normalizeTreasuryResponse,
    normalizeLoansResponse,
} = normalizeModule;

test('toNumber parses numbers and numeric strings safely', () => {
    assert.equal(toNumber(12.5), 12.5);
    assert.equal(toNumber('42.1'), 42.1);
    assert.equal(toNumber('not-a-number'), 0);
    assert.equal(toNumber(null), 0);
});

test('normalizeDate returns ISO strings for valid dates', () => {
    const input = '2024-01-02';
    const expected = new Date(input).toISOString();
    assert.equal(normalizeDate(input), expected);
    assert.equal(normalizeDate('invalid-date'), '-');
    assert.equal(normalizeDate(), '-');
});

test('normalizeTreasuryResponse coerces balances and summary values', () => {
    const payload = {
        balances: [
            { id: 'b1', currency: 'AlphaUSD', balance: '100.50', yieldEarned: '5.25' },
            { id: 'b2', currency: 'pathUSD', balance: 2, yieldEarned: '0' },
        ],
        summary: { totalBalance: '102.5', totalYield: '5.25', currencies: '2' },
    };

    const normalized = normalizeTreasuryResponse(payload);

    assert.equal(normalized.balances.length, 2);
    assert.equal(normalized.balances[0].balance, 100.5);
    assert.equal(normalized.balances[1].currency, 'pathUSD');
    assert.equal(normalized.summary.totalBalance, 102.5);
    assert.equal(normalized.summary.currencies, 2);
});

test('normalizeLoansResponse defaults missing fields and numeric strings', () => {
    const payload = {
        loans: [
            {
                id: 'l1',
                amount: '1000',
                remainingAmount: '750',
                monthlyDeduction: '250',
                currency: 'AlphaUSD',
                createdAt: '2024-02-01T00:00:00.000Z',
                employee: { name: 'Ada Lovelace' },
            },
            {
                id: 'l2',
                amount: 'invalid',
                remainingAmount: null,
                monthlyDeduction: undefined,
            },
        ],
        summary: { total: '2', totalAmount: '1000', totalRemaining: '750', active: 1, pending: 1 },
    };

    const normalized = normalizeLoansResponse(payload);

    assert.equal(normalized.loans.length, 2);
    assert.equal(normalized.loans[0].employee.name, 'Ada Lovelace');
    assert.equal(normalized.loans[1].employee.name, 'Employee');
    assert.equal(normalized.loans[1].amount, 0);
    assert.equal(normalized.loans[1].currency, 'AlphaUSD');
    assert.equal(normalized.summary.total, 2);
    assert.equal(normalized.summary.totalRemaining, 750);
});
