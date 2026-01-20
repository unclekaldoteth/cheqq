import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

// PrismaClient singleton for Next.js
declare global {
    // eslint-disable-next-line no-var
    var __prisma: PrismaClient | undefined;
}

/**
 * Get the Prisma client instance.
 * This function should only be called at runtime, not at build time.
 */
export function getPrisma(): PrismaClient {
    // Return cached instance if available
    if (global.__prisma) {
        return global.__prisma;
    }

    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is required');
    }

    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const client = new PrismaClient({ adapter });

    // Cache in development for hot reloading
    if (process.env.NODE_ENV !== 'production') {
        global.__prisma = client;
    }

    return client;
}

// For backwards compatibility - but this should NOT be used at module level
// Only use getPrisma() function in API routes
export default {
    get company() { return getPrisma().company; },
    get employee() { return getPrisma().employee; },
    get payrollRun() { return getPrisma().payrollRun; },
    get payrollItem() { return getPrisma().payrollItem; },
    get loan() { return getPrisma().loan; },
    get treasuryBalance() { return getPrisma().treasuryBalance; },
    get freelancer() { return getPrisma().freelancer; },
    get invoice() { return getPrisma().invoice; },
    get payment() { return getPrisma().payment; },
    get withdrawal() { return getPrisma().withdrawal; },
    $connect: () => getPrisma().$connect(),
    $disconnect: () => getPrisma().$disconnect(),
    $transaction: (...args: Parameters<PrismaClient['$transaction']>) => getPrisma().$transaction(...args),
};
