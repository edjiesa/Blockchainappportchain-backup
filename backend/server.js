const express = require('express');
const cors = require('cors');
const fabricConnector = require('./fabric-connector');
const { pool, dbConnectWithRetry } = require('./db/db');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3002;

// ─── FABRIC HEALTH ──────────────────────────────────
app.get('/api/status', async (req, res) => {
    try {
        const fabricOk = !!fabricConnector.getNetwork();
        let dbOk = false;
        try {
            const client = await pool.connect();
            await client.query('SELECT 1');
            client.release();
            dbOk = true;
        } catch (_) {}

        res.json({
            success: fabricOk,
            fabric: fabricOk ? 'connected' : 'initializing',
            database: dbOk ? 'connected' : 'offline',
            message: fabricOk
                ? 'Backend terhubung ke Fabric dan PostgreSQL!'
                : 'Gateway belum siap atau masih melakukan inisialisasi.'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─── BLOCKCHAIN QUERY ────────────────────────────────
app.get('/api/query', async (req, res) => {
    try {
        const { chaincode, functionName, args } = req.query;
        if (!chaincode || !functionName)
            return res.status(400).json({ error: 'chaincode dan functionName wajib diisi' });

        const network = fabricConnector.getNetwork();
        if (!network) return res.status(503).json({ error: 'Fabric gateway belum siap' });

        const contract = network.getContract(chaincode);
        const parsedArgs = args ? JSON.parse(args) : [];
        const resultBytes = await contract.evaluateTransaction(functionName, ...parsedArgs);
        const result = resultBytes.toString('utf8');

        res.json({ success: true, result: result ? JSON.parse(result) : null });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─── BLOCKCHAIN INVOKE ───────────────────────────────
app.post('/api/invoke', async (req, res) => {
    try {
        const { chaincode, functionName, args } = req.body;
        if (!chaincode || !functionName)
            return res.status(400).json({ error: 'chaincode dan functionName wajib diisi' });

        const network = fabricConnector.getNetwork();
        if (!network) return res.status(503).json({ error: 'Fabric gateway belum siap' });

        const contract = network.getContract(chaincode);
        const parsedArgs = args || [];
        const resultBytes = await contract.submitTransaction(functionName, ...parsedArgs);
        const result = resultBytes.toString('utf8');

        res.json({ success: true, result: result ? JSON.parse(result) : null });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─── SHIPMENTS (PostgreSQL) ──────────────────────────
app.get('/api/shipments', async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM shipments ORDER BY created_at DESC LIMIT 50'
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/shipments', async (req, res) => {
    try {
        const { shipment_code, exporter_name, importer_name, shipping_line_name,
                vessel_name, goods_description, origin_port, destination_port, total_weight_kg, user_id } = req.body;

        const id = `ship-${Date.now()}`;
        const { rows } = await pool.query(
            `INSERT INTO shipments (shipment_id, user_id, shipment_code, exporter_name, importer_name,
              shipping_line_name, vessel_name, goods_description, origin_port, destination_port, total_weight_kg, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$2) RETURNING *`,
            [id, user_id || 'user-001', shipment_code, exporter_name, importer_name,
             shipping_line_name, vessel_name, goods_description, origin_port, destination_port, total_weight_kg]
        );
        res.status(201).json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─── ORGANIZATIONS (PostgreSQL) ───────────────────────
app.get('/api/organizations', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM organizations ORDER BY organization_name');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─── CUSTOMS (PostgreSQL) ─────────────────────────────
app.get('/api/customs', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT cc.*, s.shipment_code, s.exporter_name, s.importer_name
             FROM customs_clearance cc
             LEFT JOIN shipments s ON cc.shipment_id = s.shipment_id
             ORDER BY cc.created_at DESC LIMIT 50`
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.patch('/api/customs/:id', async (req, res) => {
    try {
        const { customs_status, decided_by } = req.body;
        const { rows } = await pool.query(
            `UPDATE customs_clearance SET customs_status=$1, decided_by=$2, decided_at=NOW()
             WHERE customs_clearance_id=$3 RETURNING *`,
            [customs_status, decided_by, req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─── DOCUMENTS (PostgreSQL) ──────────────────────────
app.get('/api/documents', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT d.*, s.shipment_code FROM documents d
             LEFT JOIN shipments s ON d.shipment_id = s.shipment_id
             ORDER BY d.uploaded_at DESC LIMIT 50`
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─── EBL TOKENS (PostgreSQL) ─────────────────────────
app.get('/api/ebl', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT e.*, d.document_title,
                    o1.organization_name AS current_owner_name,
                    o2.organization_name AS issuer_name
             FROM ebl_tokens e
             LEFT JOIN documents d ON e.document_id = d.document_id
             LEFT JOIN organizations o1 ON e.current_owner_org_id = o1.organization_id
             LEFT JOIN organizations o2 ON e.original_issuer_org_id = o2.organization_id
             ORDER BY e.issued_at DESC`
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─── BLOCKCHAIN EXPLORER ──────────────────────────────
app.get('/api/explorer/stats', async (req, res) => {
    try {
        const blocks = await fabricConnector.getLatestBlocks(1);
        let latestHeight = 0;
        if (blocks && blocks.length > 0) {
            latestHeight = blocks[0].block_number;
        }
        const { rows: txRows } = await pool.query('SELECT count(*) as total FROM audit_logs');
        const { rows: validRows } = await pool.query("SELECT count(*) as total FROM audit_logs WHERE sync_status='synced'");
        
        res.json({
            success: true,
            data: {
                total_transactions: parseInt(txRows[0].total) || 0,
                valid_transactions: parseInt(validRows[0].total) || 0,
                latest_block: latestHeight,
                chaincodes: ['portchain-cc', 'customs-cc', 'ebl-cc']
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/explorer/transactions', async (req, res) => {
    try {
        const blocks = await fabricConnector.getLatestBlocks(50);
        res.json({ success: true, data: blocks });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─── AUDIT LOGS (PostgreSQL) ──────────────────────────
app.get('/api/audit', async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM audit_logs ORDER BY action_timestamp DESC LIMIT 100'
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─── START SERVER ────────────────────────────────────
app.listen(PORT, async () => {
    console.log(`\n================================`);
    console.log(`Backend API berjalan di port ${PORT}`);
    console.log(`================================\n`);

    // Koneksi ke PostgreSQL
    await dbConnectWithRetry(8, 5000);

    // Koneksi ke Fabric dengan retry
    const connectFabric = async () => {
        let retries = 8;
        while (retries > 0) {
            try {
                await fabricConnector.init();
                console.log('✅ Fabric Gateway siap!');
                break;
            } catch (error) {
                console.log(`⏳ Menunggu Microfab... (sisa: ${retries - 1}): ${error.message}`);
                retries--;
                if (retries > 0) await new Promise(r => setTimeout(r, 12000));
            }
        }
    };
    connectFabric();
});
