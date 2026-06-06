UPDATE blockchain_transactions SET blockchain_tx_id = substring(md5(blockchain_tx_id || random()::text) || md5(random()::text) for 40) WHERE length(blockchain_tx_id) < 40;
