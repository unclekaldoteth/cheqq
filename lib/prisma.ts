import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

// PrismaClient singleton for Next.js hot reloading
declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined;
}

// Lazy initialization - only create client when actually used (not at build time)
function getPrismaClient(): PrismaClient {
    if (global.prisma) {
        return global.prisma;
    }

    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        // During build time, throw a clear error that will be caught
        throw new Error('DATABASE_URL environment variable is not set');
    }

    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const client = new PrismaClient({ adapter });

    if (process.env.NODE_ENV !== 'production') {
        global.prisma = client;
    }

    return client;
}

// Create a proxy that lazily initializes Prisma client
const prisma = new Proxy({} as PrismaClient, {
    get(_target, prop: keyof PrismaClient) {
        const client = getPrismaClient();
        const value = client[prop];
        if (typeof value === 'function') {
            return value.bind(client);
        }
        return value;
    },
});

export { prisma };
export default prisma;
