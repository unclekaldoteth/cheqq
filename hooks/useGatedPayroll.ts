/**
 * useGatedPayroll Hook
 * Executes payroll with permit-based authorization
 */

"use client";

import { useState, useCallback } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId } from "wagmi";
import { type Hex } from "viem";
import { usePermit } from "./usePermit";

// ========== CONTRACT ABI ==========

const CHEQQ_PAYROLL_GATED_ABI = [
    {
        name: "executePayrollWithPermit",
        type: "function",
        inputs: [
            { name: "payrollId", type: "bytes32" },
            { name: "token", type: "address" },
            {
                name: "payments",
                type: "tuple[]",
                components: [
                    { name: "recipient", type: "address" },
                    { name: "amount", type: "uint256" },
                ],
            },
            {
                name: "permit",
                type: "tuple",
                components: [
                    { name: "subject", type: "address" },
                    { name: "action", type: "bytes32" },
                    { name: "paramsHash", type: "bytes32" },
                    { name: "nonce", type: "uint256" },
                    { name: "expiry", type: "uint64" },
                    { name: "requiredSchemaUID", type: "bytes32" },
                    { name: "requiredAttestationUID", type: "bytes32" },
                ],
            },
            { name: "signature", type: "bytes" },
            { name: "attestationUID", type: "bytes32" },
        ],
        outputs: [],
        stateMutability: "nonpayable",
    },
] as const;

// Contract addresses
const PAYROLL_GATED_ADDRESS: Record<number, Hex> = {
    84532: "0x7430605AD9cbaB00961E5a52a059E9c3A2280Cd0" as Hex, // Base Sepolia
    8453: "0x0000000000000000000000000000000000000000" as Hex, // Base Mainnet - TBD
};

// ========== TYPES ==========

export interface PaymentItem {
    recipient: Hex;
    amount: bigint;
}

export interface UseGatedPayrollReturn {
    executePayroll: (
        payrollId: Hex,
        token: Hex,
        payments: PaymentItem[]
    ) => Promise<Hex | null>;
    loading: boolean;
    error: string | null;
    isSuccess: boolean;
    txHash: Hex | undefined;
    isConfirming: boolean;
}

// ========== HOOK ==========

export function useGatedPayroll(): UseGatedPayrollReturn {
    const { address } = useAccount();
    const chainId = useChainId();
    const { requestPermit, loading: permitLoading, error: permitError } = usePermit();
    const [error, setError] = useState<string | null>(null);

    const {
        writeContractAsync,
        data: hash,
        isPending,
        error: writeError,
    } = useWriteContract();

    const {
        isLoading: isConfirming,
        isSuccess,
    } = useWaitForTransactionReceipt({ hash });

    const executePayroll = useCallback(
        async (
            payrollId: Hex,
            token: Hex,
            payments: PaymentItem[]
        ): Promise<Hex | null> => {
            if (!address) {
                setError("Wallet not connected");
                return null;
            }

            const contractAddress = PAYROLL_GATED_ADDRESS[chainId];
            if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
                setError("Gated payroll contract not deployed on this chain");
                return null;
            }

            setError(null);

            try {
                // 1. Request permit from backend
                const permitResponse = await requestPermit("executePayroll", {
                    payrollId,
                    token,
                    payments: payments.map((p) => ({
                        recipient: p.recipient,
                        amount: p.amount.toString(),
                    })),
                });

                if (!permitResponse) {
                    throw new Error(permitError || "Failed to get permit");
                }

                // 2. Convert permit to contract format
                const contractPermit = {
                    subject: permitResponse.permit.subject,
                    action: permitResponse.permit.action,
                    paramsHash: permitResponse.permit.paramsHash,
                    nonce: BigInt(permitResponse.permit.nonce),
                    expiry: BigInt(permitResponse.permit.expiry),
                    requiredSchemaUID: permitResponse.permit.requiredSchemaUID,
                    requiredAttestationUID: permitResponse.permit.requiredAttestationUID,
                };

                // 3. Execute gated contract call
                const txHash = await writeContractAsync({
                    address: contractAddress,
                    abi: CHEQQ_PAYROLL_GATED_ABI,
                    functionName: "executePayrollWithPermit",
                    args: [
                        payrollId,
                        token,
                        payments.map((p) => ({
                            recipient: p.recipient,
                            amount: p.amount,
                        })),
                        contractPermit,
                        permitResponse.signature,
                        permitResponse.attestationUID,
                    ],
                });

                return txHash;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Unknown error executing payroll";
                setError(errorMessage);
                console.error("Gated payroll execution failed:", err);
                return null;
            }
        },
        [address, chainId, requestPermit, permitError, writeContractAsync]
    );

    return {
        executePayroll,
        loading: permitLoading || isPending || isConfirming,
        error: error || permitError || writeError?.message || null,
        isSuccess,
        txHash: hash,
        isConfirming,
    };
}
