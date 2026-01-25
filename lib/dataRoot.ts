/**
 * DataRoot Commitment Utilities
 * Computes Merkle root for KYC/KYB PII commitment
 */

import { keccak256, toBytes, concat, type Hex, toHex } from "viem";

// ========== TYPES ==========

export interface FreelancerKYCData {
    fullName: string;
    email: string;
    phone: string;
    country: string;
    idType: string;
    idNumber: string;
    docHash: Hex;
}

export interface CompanyKYBData {
    companyName: string;
    businessEmail: string;
    phone: string;
    country: string;
    registrationNumber: string;
    businessAddress: string;
    docHash: Hex;
}

export interface MerkleProof {
    field: string;
    value: string;
    proof: Hex[];
    dataRoot: Hex;
}

// ========== NORMALIZATION ==========

/**
 * Normalize a field value based on field name
 */
function normalizeField(name: string, value: string): string {
    const trimmed = value.trim();

    switch (name) {
        case "phone":
            // E.164 format: keep only + and digits
            return trimmed.replace(/[^+\d]/g, "");

        case "country":
            // ISO 3166-1 alpha-2: uppercase, first 2 chars
            return trimmed.toUpperCase().slice(0, 2);

        case "email":
        case "businessEmail":
            // Lowercase email
            return trimmed.toLowerCase();

        case "fullName":
        case "companyName":
        case "businessAddress":
            // Lowercase for consistent hashing
            return trimmed.toLowerCase();

        default:
            // Lowercase by default
            return trimmed.toLowerCase();
    }
}

// ========== MERKLE TREE ==========

/**
 * Compute a single leaf from field name, value, and salt
 */
function computeLeaf(fieldName: string, value: string, salt: Hex): Hex {
    const normalized = normalizeField(fieldName, value);
    return keccak256(
        concat([
            keccak256(toBytes(fieldName)),
            keccak256(toBytes(normalized)),
            salt,
        ])
    );
}

/**
 * Compute Merkle root from array of leaves
 */
function computeMerkleRoot(leaves: Hex[]): Hex {
    if (leaves.length === 0) {
        throw new Error("Cannot compute Merkle root of empty leaves");
    }
    if (leaves.length === 1) {
        return leaves[0];
    }

    // Pad to even length
    const padded =
        leaves.length % 2 === 0 ? leaves : [...leaves, leaves[leaves.length - 1]];

    const nextLevel: Hex[] = [];
    for (let i = 0; i < padded.length; i += 2) {
        const left = padded[i];
        const right = padded[i + 1];
        // Sort for deterministic ordering (smaller hash first)
        const sorted =
            left.toLowerCase() < right.toLowerCase()
                ? concat([left, right])
                : concat([right, left]);
        nextLevel.push(keccak256(sorted));
    }

    return computeMerkleRoot(nextLevel);
}

// ========== SALT GENERATION ==========

/**
 * Generate a deterministic salt for a subject
 */
export function generateSalt(
    subjectWallet: Hex,
    saltNonce: number
): Hex {
    const masterSecret = process.env.KYC_SALT_SECRET as Hex | undefined;
    if (!masterSecret) {
        throw new Error("KYC_SALT_SECRET not configured");
    }

    return keccak256(
        concat([subjectWallet, masterSecret, toHex(saltNonce, { size: 32 })])
    );
}

// ========== DATA ROOT COMPUTATION ==========

/**
 * Compute DataRoot for Freelancer KYC data
 */
export function computeFreelancerKYCDataRoot(
    data: FreelancerKYCData,
    salt: Hex
): Hex {
    // Sort fields alphabetically for deterministic ordering
    const fields: [string, string][] = [
        ["country", data.country],
        ["docHash", data.docHash],
        ["email", data.email],
        ["fullName", data.fullName],
        ["idNumber", data.idNumber],
        ["idType", data.idType],
        ["phone", data.phone],
    ];

    const leaves = fields.map(([name, value]) =>
        computeLeaf(name, value, salt)
    );

    return computeMerkleRoot(leaves);
}

/**
 * Compute DataRoot for Company KYB data
 */
export function computeCompanyKYBDataRoot(
    data: CompanyKYBData,
    salt: Hex
): Hex {
    // Sort fields alphabetically for deterministic ordering
    const fields: [string, string][] = [
        ["businessAddress", data.businessAddress],
        ["businessEmail", data.businessEmail],
        ["companyName", data.companyName],
        ["country", data.country],
        ["docHash", data.docHash],
        ["phone", data.phone],
        ["registrationNumber", data.registrationNumber],
    ];

    const leaves = fields.map(([name, value]) =>
        computeLeaf(name, value, salt)
    );

    return computeMerkleRoot(leaves);
}

/**
 * Compute company ID hash for onchain storage
 */
export function computeCompanyId(
    companyName: string,
    registrationNumber: string
): Hex {
    const normalized = `${companyName.toLowerCase().trim()}:${registrationNumber.toLowerCase().trim()}`;
    return keccak256(toBytes(normalized));
}

// ========== MERKLE PROOF (OPTIONAL) ==========

/**
 * Generate Merkle proof for a single field
 * Used for selective disclosure if needed
 */
export function generateMerkleProof(
    data: Record<string, string>,
    targetField: string,
    salt: Hex
): MerkleProof {
    const sortedFields = Object.entries(data).sort(([a], [b]) =>
        a.localeCompare(b)
    );

    const leaves = sortedFields.map(([name, value]) =>
        computeLeaf(name, value, salt)
    );

    const targetIndex = sortedFields.findIndex(([name]) => name === targetField);
    if (targetIndex === -1) {
        throw new Error(`Field "${targetField}" not found in data`);
    }

    const proof = computeMerkleProofPath(leaves, targetIndex);
    const dataRoot = computeMerkleRoot(leaves);

    return {
        field: targetField,
        value: data[targetField],
        proof,
        dataRoot,
    };
}

/**
 * Internal: compute proof path for a leaf index
 */
function computeMerkleProofPath(leaves: Hex[], index: number): Hex[] {
    if (leaves.length <= 1) return [];

    const proof: Hex[] = [];
    let currentIndex = index;
    let currentLevel = [...leaves];

    while (currentLevel.length > 1) {
        // Pad to even
        if (currentLevel.length % 2 === 1) {
            currentLevel.push(currentLevel[currentLevel.length - 1]);
        }

        // Get sibling
        const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
        proof.push(currentLevel[siblingIndex]);

        // Compute next level
        const nextLevel: Hex[] = [];
        for (let i = 0; i < currentLevel.length; i += 2) {
            const left = currentLevel[i];
            const right = currentLevel[i + 1];
            const sorted =
                left.toLowerCase() < right.toLowerCase()
                    ? concat([left, right])
                    : concat([right, left]);
            nextLevel.push(keccak256(sorted));
        }

        currentLevel = nextLevel;
        currentIndex = Math.floor(currentIndex / 2);
    }

    return proof;
}
