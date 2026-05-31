const express = require('express');
const app = express();
app.use(express.json());

const PORT = 4000;

app.post('/api/bank/validate', (req, res) => {
    console.log("[External Tier - Bank] Received Validation Request:", req.body);
    
    // Simulate complex banking logic, smart contract verification, etc.
    res.json({
        success: true,
        transaction_id: `bank-tx-${Date.now()}`,
        status: "APPROVED_FOR_BLOCKCHAIN",
        message: "Payment successfully validated and routed to Smart Contract"
    });
});

app.listen(PORT, () => {
    console.log(`[External Tier] Banking System Mock running on port ${PORT}`);
});
