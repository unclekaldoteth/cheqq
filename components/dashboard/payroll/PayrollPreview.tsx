'use client';

import styles from './PayrollPreview.module.css';

export interface PayrollItem {
    id: string;
    name: string;
    walletAddress: string;
    grossAmount: number;
    loanDeduction: number;
    netAmount: number;
    currency: 'AlphaUSD' | 'BetaUSD';
    selected: boolean;
}

interface PayrollPreviewProps {
    items: PayrollItem[];
    onToggleItem?: (id: string) => void;
    onToggleAll?: () => void;
    allSelected?: boolean;
}

export default function PayrollPreview({
    items,
    onToggleItem,
    onToggleAll,
    allSelected = false,
}: PayrollPreviewProps) {
    const formatAmount = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount) + ` ${currency}`;
    };

    const truncateAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const selectedItems = items.filter(item => item.selected);

    // Group totals by currency
    const totals = selectedItems.reduce((acc, item) => {
        if (!acc[item.currency]) {
            acc[item.currency] = { gross: 0, deductions: 0, net: 0 };
        }
        acc[item.currency].gross += item.grossAmount;
        acc[item.currency].deductions += item.loanDeduction;
        acc[item.currency].net += item.netAmount;
        return acc;
    }, {} as Record<string, { gross: number; deductions: number; net: number }>);

    return (
        <div className={styles.preview}>
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={onToggleAll}
                                        className={styles.checkbox}
                                    />
                                </label>
                            </th>
                            <th>Employee</th>
                            <th>Wallet</th>
                            <th className={styles.alignRight}>Gross</th>
                            <th className={styles.alignRight}>Loan Deduction</th>
                            <th className={styles.alignRight}>Net Payout</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => (
                            <tr key={item.id} className={item.selected ? styles.selected : ''}>
                                <td>
                                    <label className={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            checked={item.selected}
                                            onChange={() => onToggleItem?.(item.id)}
                                            className={styles.checkbox}
                                        />
                                    </label>
                                </td>
                                <td>
                                    <div className={styles.employeeCell}>
                                        <div className={styles.avatar}>
                                            {item.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className={styles.name}>{item.name}</span>
                                    </div>
                                </td>
                                <td className={styles.wallet}>
                                    {truncateAddress(item.walletAddress)}
                                </td>
                                <td className={styles.alignRight}>
                                    <span className={styles.amount}>
                                        {formatAmount(item.grossAmount, item.currency)}
                                    </span>
                                </td>
                                <td className={styles.alignRight}>
                                    {item.loanDeduction > 0 ? (
                                        <span className={styles.deduction}>
                                            -{formatAmount(item.loanDeduction, item.currency)}
                                        </span>
                                    ) : (
                                        <span className={styles.noDeduction}>—</span>
                                    )}
                                </td>
                                <td className={styles.alignRight}>
                                    <span className={styles.netAmount}>
                                        {formatAmount(item.netAmount, item.currency)}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Summary */}
            <div className={styles.summary}>
                <h4>Payment Summary</h4>
                <div className={styles.summaryStats}>
                    <div className={styles.stat}>
                        <span className={styles.statLabel}>Selected Employees</span>
                        <span className={styles.statValue}>{selectedItems.length} / {items.length}</span>
                    </div>
                    {Object.entries(totals).map(([currency, amounts]) => (
                        <div key={currency} className={styles.currencySection}>
                            <div className={styles.currencyHeader}>{currency}</div>
                            <div className={styles.currencyGrid}>
                                <div className={styles.stat}>
                                    <span className={styles.statLabel}>Gross Total</span>
                                    <span className={styles.statValue}>
                                        {formatAmount(amounts.gross, currency)}
                                    </span>
                                </div>
                                <div className={styles.stat}>
                                    <span className={styles.statLabel}>Loan Deductions</span>
                                    <span className={`${styles.statValue} ${styles.deductionValue}`}>
                                        -{formatAmount(amounts.deductions, currency)}
                                    </span>
                                </div>
                                <div className={`${styles.stat} ${styles.netTotal}`}>
                                    <span className={styles.statLabel}>Net Payout</span>
                                    <span className={styles.statValue}>
                                        {formatAmount(amounts.net, currency)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
