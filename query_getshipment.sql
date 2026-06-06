SELECT * FROM blockchain_transactions WHERE tx_id IN (SELECT tx_id FROM shipments WHERE shipment_id = 'a8b0d5cf-32a3-4fa5-a94b-8ee196ce22ad');
