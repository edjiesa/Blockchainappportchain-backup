const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://portchain:portchain123@localhost:5432/portchain_offchain',
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    max: 10,
});

pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL error:', err.message);
});

const dbConnectWithRetry = async (retries = 5, delay = 5000) => {
    for (let i = 0; i < retries; i++) {
        try {
            const client = await pool.connect();
            const result = await client.query('SELECT NOW()');
            client.release();
            console.log(`✅ PostgreSQL terhubung! Server time: ${result.rows[0].now}`);
            return true;
        } catch (err) {
            console.log(`⏳ Menunggu PostgreSQL... (percobaan ${i + 1}/${retries}): ${err.message}`);
            if (i < retries - 1) await new Promise(r => setTimeout(r, delay));
        }
    }
    console.error('❌ Gagal terhubung ke PostgreSQL setelah beberapa percobaan.');
    return false;
};

module.exports = { pool, dbConnectWithRetry };
