/**
 * EIP-712 Permit Signing Utilities for Tempo
 * Signs permits for backend authorization of gated contract calls
 */

import { createWalletClient, http, keccak256, toBytes, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { tempoTestnet } from "@/providers/OnchainProvider";

// ========== CONSTANTS ==========

const TEMPO_RPC_URL =
    process.env.NEXT_PUBLIC_TEMPO_RPC_URL ||
    process.env.TEMPO_RPC_URL ||
    "https://rpc.moderato.tempo.xyz";

const PERMIT_TYPES = {
    Permit: [
        { name: "subject", type: "address" },
        { name: "action", type: "bytes32" },
        { name: "paramsHash", type: "bytes32" },
        { name: "nonce", type: "uint256" },
        { name: "expiry", type: "uint64" },
        { name: "requiredSchemaUID", type: "bytes32" },
        { name: "requiredAttestationUID", type: "bytes32" },
    ],
} as const;

// Permit expiry: 1 hour (in seconds)
export const PERMIT_EXPIRY_SECONDS = 60 * 60;

// ========== TYPES ==========

export interface PermitData {
    subject: Hex;
    action: Hex;
    paramsHash: Hex;
    nonce: bigint;
    expiry: bigint;
    requiredSchemaUID: Hex;
    requiredAttestationUID: Hex;
}

export interface SignedPermit {
    permit: PermitData;
    signature: Hex;
}

// ========== ACTION CONSTANTS ==========

export const ACTIONS = {
    EXECUTE_PAYROLL: keccak256(toBytes("executePayroll")),
    CREATE_INVOICE: keccak256(toBytes("createInvoice")),
    WITHDRAW: keccak256(toBytes("withdraw")),
    ADD_EMPLOYEE: keccak256(toBytes("addEmployee")),
    TRANSFER: keccak256(toBytes("transfer")),
} as const;

// ========== FUNCTIONS ==========

/**
 * Sign a permit using the backend signer key
 */
export async function signPermit(
    permit: PermitData,
    chainId: number,
    contractAddress: Hex
): Promise<Hex> {
    const privateKey = process.env.PERMIT_SIGNER_PRIVATE_KEY;
    if (!privateKey) {
        throw new Error("PERMIT_SIGNER_PRIVATE_KEY not configured");
    }

    const account = privateKeyToAccount(privateKey as Hex);

    const client = createWalletClient({
        account,
        chain: tempoTestnet,
        transport: http(TEMPO_RPC_URL),
    });

    const signature = await client.signTypedData({
        domain: {
            name: "CheqqPermit",
            version: "1",
            chainId,
            verifyingContract: contractAddress,
        },
        types: PERMIT_TYPES,
        primaryType: "Permit",
        message: {
            subject: permit.subject,
            action: permit.action,
            paramsHash: permit.paramsHash,
            nonce: permit.nonce,
            expiry: permit.expiry,
            requiredSchemaUID: permit.requiredSchemaUID,
            requiredAttestationUID: permit.requiredAttestationUID,
        },
    });

    return signature;
}

/**
 * Create a complete signed permit
 */
export async function createSignedPermit(
    subject: Hex,
    action: Hex,
    params: unknown,
    nonce: bigint,
    requiredSchemaUID: Hex,
    requiredAttestationUID: Hex,
    chainId: number,
    contractAddress: Hex
): Promise<SignedPermit> {
    const expiry = BigInt(Math.floor(Date.now() / 1000) + PERMIT_EXPIRY_SECONDS);
    const paramsHash = computeParamsHash(params);

    const permit: PermitData = {
        subject,
        action,
        paramsHash,
        nonce,
        expiry,
        requiredSchemaUID,
        requiredAttestationUID,
    };

    const signature = await signPermit(permit, chainId, contractAddress);

    return { permit, signature };
}

/**
 * Compute keccak256 hash of action name
 */
export function computeActionHash(action: string): Hex {
    return keccak256(toBytes(action));
}

/**
 * Compute keccak256 hash of action parameters
 * Uses JSON stringify for consistent serialization
 */
export function computeParamsHash(params: unknown): Hex {
    const serialized = JSON.stringify(params, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
    );
    return keccak256(toBytes(serialized));
}

/**
 * Get the gated actions contract address for Tempo Testnet
 */
export function getGatedActionsAddress(chainId: number): Hex {
    const configuredTempoAddress = (
        process.env.CHEQQ_GATED_ACTIONS_ADDRESS ||
        process.env.NEXT_PUBLIC_CHEQQ_GATED_ACTIONS_ADDRESS ||
        "0x0000000000000000000000000000000000000000"
    ) as Hex;

    const addresses: Record<number, Hex> = {
        42431: configuredTempoAddress,
    };

    const address = addresses[chainId];
    if (!address || address === "0x0000000000000000000000000000000000000000") {
        throw new Error(`Gated actions contract not deployed on chain ${chainId}`);
    }

    return address;
}
