/**
 * useKYCStatus Hook
 * Checks KYC/KYB verification status for the connected wallet
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, useChainId } from "wagmi";
import { type Hex } from "viem";

// ========== TYPES ==========

export type VerificationStatus = "none" | "pending" | "verified" | "expired" | "revoked";

export interface KYCCredential {
    id: string;
    level: number;
    attestationUid: Hex | null;
    expiresAt: string;
    provider: string;
    status: VerificationStatus;
}

export interface KYBCredential {
    id: string;
    companyId: string;
    companyHash: Hex;
    level: number;
    attestationUid: Hex | null;
    expiresAt: string;
    provider: string;
    status: VerificationStatus;
}

export interface CompanyRole {
    companyId: string;
    companyName: string;
    role: "OWNER" | "ADMIN" | "OPERATOR";
    attestationUid: Hex | null;
}

export interface VerificationInfo {
    isFreelancer: boolean;
    isCompanyMember: boolean;
    kycCredential: KYCCredential | null;
    kybCredential: KYBCredential | null;
    companyRoles: CompanyRole[];
    hasValidCredential: boolean;
}

export interface UseKYCStatusReturn {
    status: VerificationInfo | null;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

// ========== HOOK ==========

export function useKYCStatus(): UseKYCStatusReturn {
    const { address, isConnected } = useAccount();
    const chainId = useChainId();
    const [status, setStatus] = useState<VerificationInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStatus = useCallback(async () => {
        if (!isConnected || !address) {
            setStatus(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `/api/kyc/status?walletAddress=${address}&chainId=${chainId}`
            );

            if (!response.ok) {
                if (response.status === 404) {
                    // Not registered
                    setStatus({
                        isFreelancer: false,
                        isCompanyMember: false,
                        kycCredential: null,
                        kybCredential: null,
                        companyRoles: [],
                        hasValidCredential: false,
                    });
                    return;
                }
                throw new Error("Failed to fetch KYC status");
            }

            const data = await response.json();
            setStatus(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Unknown error";
            setError(errorMessage);
            console.error("KYC status fetch failed:", err);
        } finally {
            setLoading(false);
        }
    }, [address, chainId, isConnected]);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    return {
        status,
        loading,
        error,
        refresh: fetchStatus,
    };
}
