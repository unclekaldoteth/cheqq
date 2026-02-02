'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { usePrivy } from '@privy-io/react-auth';

export type UserType = 'company' | 'freelancer' | null;

export interface CompanyUser {
    id: string;
    name: string;
    email: string;
    walletAddress: string;
    logo: string | null;
    createdAt: string;
}

export interface FreelancerUser {
    id: string;
    name: string;
    email: string;
    walletAddress: string;
    profession: string | null;
    bio: string | null;
    reputationScore: number;
    createdAt: string;
}

export type UserData = CompanyUser | FreelancerUser | null;

interface UserContextType {
    user: UserData;
    userType: UserType;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const { user: privyUser, ready, authenticated } = usePrivy();
    const [user, setUser] = useState<UserData>(null);
    const [userType, setUserType] = useState<UserType>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const activeWalletRef = useRef<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const fetchUser = useCallback(async () => {
        // Get wallet address from Privy user
        const wallet = privyUser?.wallet?.address?.trim();

        if (!wallet) {
            abortRef.current?.abort();
            activeWalletRef.current = null;
            setUser(null);
            setUserType(null);
            setError(null);
            setLoading(false);
            return;
        }

        const normalizedWallet = wallet.toLowerCase();
        if (activeWalletRef.current !== normalizedWallet) {
            activeWalletRef.current = normalizedWallet;
            setUser(null);
            setUserType(null);
        }

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/user?wallet=${encodeURIComponent(normalizedWallet)}`, {
                cache: 'no-store',
                signal: controller.signal,
            });
            const data = await response.json().catch(() => ({}));

            if (controller.signal.aborted) return;

            if (response.ok && data.type) {
                setUser(data.data);
                setUserType(data.type);
            } else {
                setUser(null);
                setUserType(null);
                if (response.status !== 404) {
                    setError(data.error || 'Failed to fetch user');
                }
            }
        } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') {
                return;
            }
            console.error('Error fetching user:', err);
            setError('Failed to fetch user data');
            setUser(null);
            setUserType(null);
        } finally {
            if (!controller.signal.aborted) {
                setLoading(false);
            }
        }
    }, [privyUser?.wallet?.address]);

    // Fetch user when Privy is ready and user is authenticated
    useEffect(() => {
        if (ready && authenticated) {
            fetchUser();
        } else if (ready && !authenticated) {
            abortRef.current?.abort();
            setUser(null);
            setUserType(null);
            setError(null);
            setLoading(false);
        }
    }, [ready, authenticated, fetchUser]);

    useEffect(() => () => abortRef.current?.abort(), []);

    return (
        <UserContext.Provider value={{ user, userType, loading, error, refetch: fetchUser }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}

// Helper to get initials from name
export function getInitials(name: string): string {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}
