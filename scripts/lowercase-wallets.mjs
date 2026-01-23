import { Pool } from 'pg';

const run = async () => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        throw new Error('DATABASE_URL is required');
    }

    const pool = new Pool({ connectionString: databaseUrl });
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const companyResult = await client.query(
            'UPDATE "Company" SET "walletAddress" = LOWER("walletAddress") WHERE "walletAddress" IS NOT NULL'
        );
        const freelancerResult = await client.query(
            'UPDATE "Freelancer" SET "walletAddress" = LOWER("walletAddress") WHERE "walletAddress" IS NOT NULL'
        );
        await client.query('COMMIT');

        console.log('Wallet normalization complete.');
        console.log(`Companies updated: ${companyResult.rowCount}`);
        console.log(`Freelancers updated: ${freelancerResult.rowCount}`);
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
};

run().catch((error) => {
    console.error('Wallet normalization failed:', error);
    process.exitCode = 1;
});
