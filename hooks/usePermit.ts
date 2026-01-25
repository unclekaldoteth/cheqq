/**
 * usePermit Hook
 * Requests a signed permit from the backend for gated contract calls
 */

"use client";

import { useState, useCallback } from "react";
import { useAccount, useChainId } from "wagmi";
import { type Hex } from "viem";

// ========== TYPES ==========

export interface Permit {
    subject: Hex;
    action: Hex;
    paramsHash: Hex;
    nonce: string;
    expiry: string;
    requiredSchemaUID: Hex;
    requiredAttestationUID: Hex;
}

export interface PermitResponse {
    permit: Permit;
    signature: Hex;
    attestationUID: Hex;
    chainId: number;
    expiresAt: string;
}

export interface UsePermitReturn {
    requestPermit: (action: string, params: Record<string, unknown>) => Promise<PermitResponse | null>;
    loading: boolean;
    error: string | null;
    clearError: () => void;
}

// ========== HOOK ==========

export function usePermit(): UsePermitReturn {
    const { address, isConnected } = useAccount();
    const chainId = useChainId();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const requestPermit = useCallback(
        async (
            action: string,
            params: Record<string, unknown>
        ): Promise<PermitResponse | null> => {
            if (!isConnected || !address) {
                setError("Wallet not connected");
                return null;
            }

            setLoading(true);
            setError(null);

            try {
                const response = await fetch("/api/permit", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        walletAddress: address,
                        action,
                        params,
                        chainId,
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || `Failed to get permit: ${response.status}`);
                }

                return data as PermitResponse;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Unknown error requesting permit";
                setError(errorMessage);
                console.error("Permit request failed:", err);
                return null;
            } finally {
                setLoading(false);
            }
        },
        [address, chainId, isConnected]
    );

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        requestPermit,
        loading,
        error,
        clearError,
    };
}
