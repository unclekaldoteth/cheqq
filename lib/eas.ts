/**
 * Ethereum Attestation Service (EAS) Utilities
 * Creates and manages KYC/KYB attestations on Base
 */

import { createPublicClient, createWalletClient, http, type Hex, encodeFunctionData } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia, base } from "viem/chains";

// ========== CONSTANTS ==========

// EAS Contract (same on Base Sepolia & Mainnet - predeploy)
export const EAS_CONTRACT_ADDRESS: Hex = "0x4200000000000000000000000000000000000021";
export const SCHEMA_REGISTRY_ADDRESS: Hex = "0x4200000000000000000000000000000000000020";

// Schema UIDs - populated after registration
export const SCHEMA_UIDS = {
    baseSepolia: {
        freelancerKYC: "0xd2bbe06643569cf75841c50c7834cbbf63ec47a69959f5e8d328a398dd0ac876" as Hex,
        companyKYB: "0xc22c2aec64990625186cb46a17d087ae983bb10ad702974ef365aca13cb90536" as Hex,
        companyRole: "0xd669738954574396229fad714eb71265ac357040bd9b1b109905000975899a99" as Hex,
    },
    base: {
        freelancerKYC: "" as Hex, // Set when deploying to mainnet
        companyKYB: "" as Hex,
        companyRole: "" as Hex,
    },
} as const;

// Schema strings for registration
export const SCHEMA_STRINGS = {
    freelancerKYC: "uint8 level,uint64 expiresAt,bytes32 dataRoot",
    companyKYB: "bytes32 companyId,uint8 level,uint64 expiresAt,bytes32 dataRoot",
    companyRole: "bytes32 companyId,uint8 role",
} as const;

// ========== TYPES ==========

export interface FreelancerKYCAttestationData {
    level: number; // 1=Basic, 2=Standard, 3=Enhanced
    expiresAt: bigint;
    dataRoot: Hex;
}

export interface CompanyKYBAttestationData {
    companyId: Hex;
    level: number;
    expiresAt: bigint;
    dataRoot: Hex;
}

export interface CompanyRoleAttestationData {
    companyId: Hex;
    role: number; // 1=OWNER, 2=ADMIN, 3=OPERATOR
}

export interface AttestationResponse {
    attestationUID: Hex;
    txHash: Hex;
}

// ========== ABI FRAGMENTS ==========

const EAS_ABI = [
    {
        name: "attest",
        type: "function",
        inputs: [
            {
                name: "request",
                type: "tuple",
                components: [
                    { name: "schema", type: "bytes32" },
                    {
                        name: "data",
                        type: "tuple",
                        components: [
                            { name: "recipient", type: "address" },
                            { name: "expirationTime", type: "uint64" },
                            { name: "revocable", type: "bool" },
                            { name: "refUID", type: "bytes32" },
                            { name: "data", type: "bytes" },
                            { name: "value", type: "uint256" },
                        ],
                    },
                ],
            },
        ],
        outputs: [{ name: "", type: "bytes32" }],
    },
    {
        name: "revoke",
        type: "function",
        inputs: [
            {
                name: "request",
                type: "tuple",
                components: [
                    { name: "schema", type: "bytes32" },
                    {
                        name: "data",
                        type: "tuple",
                        components: [
                            { name: "uid", type: "bytes32" },
                            { name: "value", type: "uint256" },
                        ],
                    },
                ],
            },
        ],
        outputs: [],
    },
    {
        name: "getAttestation",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "uid", type: "bytes32" }],
        outputs: [
            {
                name: "",
                type: "tuple",
                components: [
                    { name: "uid", type: "bytes32" },
                    { name: "schema", type: "bytes32" },
                    { name: "time", type: "uint64" },
                    { name: "expirationTime", type: "uint64" },
                    { name: "revocationTime", type: "uint64" },
                    { name: "refUID", type: "bytes32" },
                    { name: "recipient", type: "address" },
                    { name: "attester", type: "address" },
                    { name: "revocable", type: "bool" },
                    { name: "data", type: "bytes" },
                ],
            },
        ],
    },
] as const;

const SCHEMA_REGISTRY_ABI = [
    {
        name: "register",
        type: "function",
        inputs: [
            { name: "schema", type: "string" },
            { name: "resolver", type: "address" },
            { name: "revocable", type: "bool" },
        ],
        outputs: [{ name: "", type: "bytes32" }],
    },
] as const;

// ========== HELPER FUNCTIONS ==========

function getChain(chainId: number) {
    return chainId === 8453 ? base : baseSepolia;
}

function getSchemaUIDs(chainId: number) {
    return chainId === 8453 ? SCHEMA_UIDS.base : SCHEMA_UIDS.baseSepolia;
}

async function getWalletClient(chainId: number) {
    const privateKey = process.env.ATTESTER_PRIVATE_KEY;
    if (!privateKey) {
        throw new Error("ATTESTER_PRIVATE_KEY not configured");
    }

    const account = privateKeyToAccount(privateKey as Hex);
    const chain = getChain(chainId);

    return createWalletClient({
        account,
        chain,
        transport: http(),
    });
}

function encodeFreelancerKYCData(data: FreelancerKYCAttestationData): Hex {
    // ABI encode: uint8 level, uint64 expiresAt, bytes32 dataRoot
    const encoded = encodeFunctionData({
        abi: [
            {
                name: "encode",
                type: "function",
                inputs: [
                    { name: "level", type: "uint8" },
                    { name: "expiresAt", type: "uint64" },
                    { name: "dataRoot", type: "bytes32" },
                ],
            },
        ],
        functionName: "encode",
        args: [data.level, data.expiresAt, data.dataRoot],
    });
    // Remove function selector (first 4 bytes / 10 chars including 0x)
    return `0x${encoded.slice(10)}` as Hex;
}

function encodeCompanyKYBData(data: CompanyKYBAttestationData): Hex {
    const encoded = encodeFunctionData({
        abi: [
            {
                name: "encode",
                type: "function",
                inputs: [
                    { name: "companyId", type: "bytes32" },
                    { name: "level", type: "uint8" },
                    { name: "expiresAt", type: "uint64" },
                    { name: "dataRoot", type: "bytes32" },
                ],
            },
        ],
        functionName: "encode",
        args: [data.companyId, data.level, data.expiresAt, data.dataRoot],
    });
    return `0x${encoded.slice(10)}` as Hex;
}

function encodeCompanyRoleData(data: CompanyRoleAttestationData): Hex {
    const encoded = encodeFunctionData({
        abi: [
            {
                name: "encode",
                type: "function",
                inputs: [
                    { name: "companyId", type: "bytes32" },
                    { name: "role", type: "uint8" },
                ],
            },
        ],
        functionName: "encode",
        args: [data.companyId, data.role],
    });
    return `0x${encoded.slice(10)}` as Hex;
}

// ========== ATTESTATION CREATION ==========

/**
 * Create a Freelancer KYC attestation
 */
export async function createFreelancerKYCAttestation(
    recipient: Hex,
    data: FreelancerKYCAttestationData,
    chainId: number
): Promise<AttestationResponse> {
    const client = await getWalletClient(chainId);
    const schemaUID = getSchemaUIDs(chainId).freelancerKYC;

    if (!schemaUID) {
        throw new Error(`FreelancerKYC schema not registered on chain ${chainId}`);
    }

    const encodedData = encodeFreelancerKYCData(data);

    const txHash = await client.writeContract({
        address: EAS_CONTRACT_ADDRESS,
        abi: EAS_ABI,
        functionName: "attest",
        args: [
            {
                schema: schemaUID,
                data: {
                    recipient,
                    expirationTime: data.expiresAt,
                    revocable: true,
                    refUID: "0x0000000000000000000000000000000000000000000000000000000000000000" as Hex,
                    data: encodedData,
                    value: BigInt(0),
                },
            },
        ],
    });

    // Get attestation UID from transaction receipt
    const publicClient = createPublicClient({
        chain: getChain(chainId),
        transport: http(),
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    // The attestation UID is in the first log's first topic (after event signature)
    // For simplicity, we'll return the tx hash and let the caller query EAS
    // In production, parse the Attested event log
    const attestationUID = receipt.logs[0]?.topics[1] as Hex || "0x" as Hex;

    return { attestationUID, txHash };
}

/**
 * Create a Company KYB attestation
 */
export async function createCompanyKYBAttestation(
    data: CompanyKYBAttestationData,
    chainId: number
): Promise<AttestationResponse> {
    const client = await getWalletClient(chainId);
    const schemaUID = getSchemaUIDs(chainId).companyKYB;

    if (!schemaUID) {
        throw new Error(`CompanyKYB schema not registered on chain ${chainId}`);
    }

    const encodedData = encodeCompanyKYBData(data);

    // Recipient is zero address for company-level attestation
    const txHash = await client.writeContract({
        address: EAS_CONTRACT_ADDRESS,
        abi: EAS_ABI,
        functionName: "attest",
        args: [
            {
                schema: schemaUID,
                data: {
                    recipient: "0x0000000000000000000000000000000000000000" as Hex,
                    expirationTime: data.expiresAt,
                    revocable: true,
                    refUID: "0x0000000000000000000000000000000000000000000000000000000000000000" as Hex,
                    data: encodedData,
                    value: BigInt(0),
                },
            },
        ],
    });

    const publicClient = createPublicClient({
        chain: getChain(chainId),
        transport: http(),
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    const attestationUID = receipt.logs[0]?.topics[1] as Hex || "0x" as Hex;

    return { attestationUID, txHash };
}

/**
 * Create a Company Role attestation (linked to KYB via refUID)
 */
export async function createCompanyRoleAttestation(
    recipient: Hex,
    data: CompanyRoleAttestationData,
    kybAttestationUID: Hex,
    chainId: number
): Promise<AttestationResponse> {
    const client = await getWalletClient(chainId);
    const schemaUID = getSchemaUIDs(chainId).companyRole;

    if (!schemaUID) {
        throw new Error(`CompanyRole schema not registered on chain ${chainId}`);
    }

    const encodedData = encodeCompanyRoleData(data);

    // Role attestation references parent KYB attestation
    // expirationTime = 0 means it inherits from parent KYB
    const txHash = await client.writeContract({
        address: EAS_CONTRACT_ADDRESS,
        abi: EAS_ABI,
        functionName: "attest",
        args: [
            {
                schema: schemaUID,
                data: {
                    recipient,
                    expirationTime: BigInt(0), // Inherits from parent KYB
                    revocable: true,
                    refUID: kybAttestationUID, // Links to parent KYB
                    data: encodedData,
                    value: BigInt(0),
                },
            },
        ],
    });

    const publicClient = createPublicClient({
        chain: getChain(chainId),
        transport: http(),
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    const attestationUID = receipt.logs[0]?.topics[1] as Hex || "0x" as Hex;

    return { attestationUID, txHash };
}

// ========== ATTESTATION REVOCATION ==========

/**
 * Revoke an attestation
 */
export async function revokeAttestation(
    attestationUID: Hex,
    schemaUID: Hex,
    chainId: number
): Promise<Hex> {
    const client = await getWalletClient(chainId);

    const txHash = await client.writeContract({
        address: EAS_CONTRACT_ADDRESS,
        abi: EAS_ABI,
        functionName: "revoke",
        args: [
            {
                schema: schemaUID,
                data: {
                    uid: attestationUID,
                    value: BigInt(0),
                },
            },
        ],
    });

    return txHash;
}

// ========== ATTESTATION VERIFICATION ==========

export interface Attestation {
    uid: Hex;
    schema: Hex;
    time: bigint;
    expirationTime: bigint;
    revocationTime: bigint;
    refUID: Hex;
    recipient: Hex;
    attester: Hex;
    revocable: boolean;
    data: Hex;
}

/**
 * Get an attestation by UID
 */
export async function getAttestation(
    attestationUID: Hex,
    chainId: number
): Promise<Attestation | null> {
    const publicClient = createPublicClient({
        chain: getChain(chainId),
        transport: http(),
    });

    const result = await publicClient.readContract({
        address: EAS_CONTRACT_ADDRESS,
        abi: EAS_ABI,
        functionName: "getAttestation",
        args: [attestationUID],
    }) as {
        uid: Hex;
        schema: Hex;
        time: bigint;
        expirationTime: bigint;
        revocationTime: bigint;
        refUID: Hex;
        recipient: Hex;
        attester: Hex;
        revocable: boolean;
        data: Hex;
    };

    // Check if attestation exists (uid will be zero if not found)
    if (result.uid === "0x0000000000000000000000000000000000000000000000000000000000000000") {
        return null;
    }

    return {
        uid: result.uid,
        schema: result.schema,
        time: result.time,
        expirationTime: result.expirationTime,
        revocationTime: result.revocationTime,
        refUID: result.refUID,
        recipient: result.recipient,
        attester: result.attester,
        revocable: result.revocable,
        data: result.data,
    };
}

/**
 * Check if an attestation is valid (not expired, not revoked)
 */
export async function isAttestationValid(
    attestationUID: Hex,
    chainId: number
): Promise<boolean> {
    const attestation = await getAttestation(attestationUID, chainId);

    if (!attestation) return false;
    if (attestation.revocationTime !== BigInt(0)) return false;
    if (
        attestation.expirationTime !== BigInt(0) &&
        BigInt(Math.floor(Date.now() / 1000)) > attestation.expirationTime
    ) {
        return false;
    }

    return true;
}

// ========== SCHEMA REGISTRATION ==========

/**
 * Register a schema on the Schema Registry
 */
export async function registerSchema(
    schema: string,
    chainId: number
): Promise<Hex> {
    const client = await getWalletClient(chainId);

    const txHash = await client.writeContract({
        address: SCHEMA_REGISTRY_ADDRESS,
        abi: SCHEMA_REGISTRY_ABI,
        functionName: "register",
        args: [
            schema,
            "0x0000000000000000000000000000000000000000" as Hex, // No resolver
            true, // Revocable
        ],
    });

    return txHash;
}

// ========== KYC PROVIDER ABSTRACTION ==========

export type KycProvider = "MANUAL" | "SUMSUB" | "JUMIO" | "PERSONA";

export interface KycProviderConfig {
    provider: KycProvider;
    apiKey?: string;
    webhookSecret?: string;
}

/**
 * Abstract interface for KYC providers
 * Implement this for third-party integration
 */
export interface IKycProvider {
    startVerification(userId: string, walletAddress: Hex): Promise<{ sessionId: string; redirectUrl?: string }>;
    getVerificationStatus(sessionId: string): Promise<{ status: "pending" | "approved" | "rejected"; data?: Record<string, string> }>;
    handleWebhook(payload: unknown): Promise<{ userId: string; status: "approved" | "rejected"; data?: Record<string, string> }>;
}

/**
 * Manual KYC provider (default)
 * Documents are stored and reviewed manually
 */
export class ManualKycProvider implements IKycProvider {
    async startVerification(userId: string): Promise<{ sessionId: string }> {
        // Generate a session ID for manual review
        return { sessionId: `manual_${userId}_${Date.now()}` };
    }

    async getVerificationStatus(sessionId: string): Promise<{ status: "pending" | "approved" | "rejected" }> {
        // In production, check the database for manual review status
        console.log(`Checking status for session: ${sessionId}`);
        return { status: "pending" };
    }

    async handleWebhook(): Promise<{ userId: string; status: "approved" | "rejected" }> {
        throw new Error("Manual provider does not use webhooks");
    }
}

/**
 * Get KYC provider instance based on config
 */
export function getKycProvider(config: KycProviderConfig): IKycProvider {
    switch (config.provider) {
        case "MANUAL":
            return new ManualKycProvider();
        // Future: Add third-party provider implementations
        // case "SUMSUB":
        //   return new SumsubKycProvider(config);
        // case "JUMIO":
        //   return new JumioKycProvider(config);
        default:
            return new ManualKycProvider();
    }
}
