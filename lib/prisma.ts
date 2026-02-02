import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

// PrismaClient singleton for Next.js (works in both dev and production/serverless)
declare global {
    var __prisma: PrismaClient | undefined;
    var __pool: Pool | undefined;
}

/**
 * Get the Prisma client instance.
 * This function should only be called at runtime, not at build time.
 * Uses singleton pattern to prevent connection pool exhaustion in serverless.
 */
export function getPrisma(): PrismaClient {
    // Return cached instance if available (works in both dev and production)
    if (global.__prisma) {
        return global.__prisma;
    }

    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is required');
    }

    // Use cached pool or create new one with serverless-friendly settings
    if (!global.__pool) {
        global.__pool = new Pool({
            connectionString,
            max: 5, // Limit connections for serverless
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
        });
    }

    const adapter = new PrismaPg(global.__pool);
    const client = new PrismaClient({ adapter });

    // ALWAYS cache in global for serverless (prevents connection exhaustion)
    global.__prisma = client;

    return client;
}

// Prisma client proxy - lazy initialization to avoid build-time errors
// Add all models here for type-safe access
export const prisma = {
    // B2B Models
    get company() { return getPrisma().company; },
    get employee() { return getPrisma().employee; },
    get payrollRun() { return getPrisma().payrollRun; },
    get payrollItem() { return getPrisma().payrollItem; },
    get loan() { return getPrisma().loan; },
    get treasuryBalance() { return getPrisma().treasuryBalance; },

    // B2C Models
    get freelancer() { return getPrisma().freelancer; },
    get invoice() { return getPrisma().invoice; },
    get payment() { return getPrisma().payment; },
    get withdrawal() { return getPrisma().withdrawal; },

    // KYC/KYB Verification Models
    get kycCredential() { return getPrisma().kycCredential; },
    get kybCredential() { return getPrisma().kybCredential; },
    get companyWalletRole() { return getPrisma().companyWalletRole; },
    get permitNonce() { return getPrisma().permitNonce; },
    get kycSalt() { return getPrisma().kycSalt; },
    get auditLog() { return getPrisma().auditLog; },
    get blockedSubject() { return getPrisma().blockedSubject; },

    // Prisma client methods
    $connect: () => getPrisma().$connect(),
    $disconnect: () => getPrisma().$disconnect(),
    $transaction: (...args: Parameters<PrismaClient['$transaction']>) => getPrisma().$transaction(...args),
    $queryRaw: <T = unknown>(...args: Parameters<PrismaClient['$queryRaw']>) => getPrisma().$queryRaw<T>(...args),
    $executeRaw: (...args: Parameters<PrismaClient['$executeRaw']>) => getPrisma().$executeRaw(...args),
};

export default prisma;
