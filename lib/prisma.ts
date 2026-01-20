import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

// PostgreSQL connection pool
const connectionString = process.env.DATABASE_URL;

// PrismaClient singleton for Next.js hot reloading
declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
    if (!connectionString) {
        console.warn('DATABASE_URL not set - using mock database behavior');
        // Return a basic Prisma client that will fail on actual queries
        // This allows the app to build/start without a DB connection
        return new PrismaClient() as PrismaClient;
    }

    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
}

export const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
}

export default prisma;
