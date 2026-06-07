-- =====================================================
-- PortChain Off-Chain Database Schema (PostgreSQL)
-- Update ERD: 14 Entities as requested
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Entity Organizations
CREATE TABLE IF NOT EXISTS organizations (
    organization_id   VARCHAR(50) PRIMARY KEY,
    organization_name VARCHAR(200) NOT NULL,
    organization_type VARCHAR(100) NOT NULL,
    created_at        TIMESTAMP DEFAULT NOW()
);

-- 8. Entity Blockchain Transactions
CREATE TABLE IF NOT EXISTS blockchain_transactions (
    blockchain_tx_id  VARCHAR(50) PRIMARY KEY,
    tx_id             VARCHAR(200),
    channel_name      VARCHAR(100),
    chaincode_name    VARCHAR(100),
    transaction_type  VARCHAR(100),
    validation_status VARCHAR(50),
    entity_id         VARCHAR(50),
    block_number      INTEGER,
    committed_at      TIMESTAMP,
    created_at        TIMESTAMP DEFAULT NOW()
);

-- 2. Entitas Users
CREATE TABLE IF NOT EXISTS users (
    user_id         VARCHAR(50) PRIMARY KEY,
    organization_id VARCHAR(50) REFERENCES organizations(organization_id),
    full_name       VARCHAR(200) NOT NULL,
    email           VARCHAR(200) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role_name       VARCHAR(100),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- 12. Entitas Certificates
CREATE TABLE IF NOT EXISTS certificates (
    certificate_id            VARCHAR(50) PRIMARY KEY,
    user_id                   VARCHAR(50) REFERENCES users(user_id),
    certificate_serial_number VARCHAR(200),
    certificate_subject       VARCHAR(200),
    certificate_issuer        VARCHAR(200),
    valid_from                TIMESTAMP,
    valid_until               TIMESTAMP,
    certificate_status        VARCHAR(50),
    created_at                TIMESTAMP DEFAULT NOW()
);

-- 3. Entitas Shipments
CREATE TABLE IF NOT EXISTS shipments (
    shipment_id        VARCHAR(50) PRIMARY KEY,
    organization_id    VARCHAR(50) REFERENCES organizations(organization_id),
    shipment_code      VARCHAR(100) UNIQUE NOT NULL,
    exporter_name      VARCHAR(200),
    importer_name      VARCHAR(200),
    shipping_line_name VARCHAR(200),
    vessel_name        VARCHAR(200),
    voyage_number      VARCHAR(100),
    origin_port        VARCHAR(100),
    destination_port   VARCHAR(100),
    shipment_status    VARCHAR(50),
    created_by         VARCHAR(50) REFERENCES users(user_id),
    created_at         TIMESTAMP DEFAULT NOW(),
    updated_at         TIMESTAMP DEFAULT NOW()
);

-- 4. Entitas Containers
CREATE TABLE IF NOT EXISTS containers (
    container_id     VARCHAR(50) PRIMARY KEY,
    shipment_id      VARCHAR(50) REFERENCES shipments(shipment_id),
    container_number VARCHAR(100),
    container_type   VARCHAR(50),
    size_ft          VARCHAR(20),
    seal_number      VARCHAR(100),
    gross_weight     DECIMAL(12, 2),
    container_status VARCHAR(50),
    created_at       TIMESTAMP DEFAULT NOW()
);

-- 5. Entitas Documents
CREATE TABLE IF NOT EXISTS documents (
    document_id      VARCHAR(50) PRIMARY KEY,
    shipment_id      VARCHAR(50) REFERENCES shipments(shipment_id),
    uploaded_by      VARCHAR(50) REFERENCES users(user_id),
    document_type    VARCHAR(100),
    document_number  VARCHAR(100),
    document_title   VARCHAR(200),
    document_version VARCHAR(50),
    document_status  VARCHAR(50),
    issued_at        TIMESTAMP,
    uploaded_at      TIMESTAMP DEFAULT NOW()
);

-- 6. Entitas Document Files
CREATE TABLE IF NOT EXISTS document_files (
    file_id              VARCHAR(50) PRIMARY KEY,
    document_id          VARCHAR(50) REFERENCES documents(document_id),
    original_file_name   VARCHAR(300),
    stored_file_name     VARCHAR(300),
    mime_type            VARCHAR(100),
    file_size_bytes      BIGINT,
    storage_path         VARCHAR(500),
    encryption_algorithm VARCHAR(100),
    is_encrypted         BOOLEAN DEFAULT FALSE,
    file_data            TEXT,
    created_at           TIMESTAMP DEFAULT NOW()
);

-- 7. Entitas Document Hashes
CREATE TABLE IF NOT EXISTS document_hashes (
    document_hash_id    VARCHAR(50) PRIMARY KEY,
    document_id         VARCHAR(50) REFERENCES documents(document_id),
    hash_algorithm      VARCHAR(50),
    document_hash_value VARCHAR(200),
    hash_status         VARCHAR(50),
    blockchain_tx_id    VARCHAR(50) REFERENCES blockchain_transactions(blockchain_tx_id),
    recorded_at         TIMESTAMP DEFAULT NOW()
);

-- 9. Entitas Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    audit_log_id     VARCHAR(50) PRIMARY KEY,
    user_id          VARCHAR(50) REFERENCES users(user_id),
    entity_name      VARCHAR(100),
    entity_id        VARCHAR(100),
    action_type      VARCHAR(50),
    old_value        TEXT,
    new_value        TEXT,
    action_timestamp TIMESTAMP DEFAULT NOW(),
    source_ip        VARCHAR(50),
    blockchain_tx_id VARCHAR(50) REFERENCES blockchain_transactions(blockchain_tx_id),
    sync_status      VARCHAR(50)
);

-- 10. Entitas Customs Clearance
CREATE TABLE IF NOT EXISTS customs_clearance (
    customs_clearance_id VARCHAR(50) PRIMARY KEY,
    shipment_id          VARCHAR(50) REFERENCES shipments(shipment_id),
    pib_number           VARCHAR(100),
    customs_status       VARCHAR(50),
    customs_lane         VARCHAR(50),
    decided_by           VARCHAR(50) REFERENCES users(user_id),
    decided_at           TIMESTAMP,
    notes                TEXT,
    blockchain_tx_id     VARCHAR(50) REFERENCES blockchain_transactions(blockchain_tx_id),
    created_at           TIMESTAMP DEFAULT NOW()
);

-- 11. Entitas Container Status Logs
CREATE TABLE IF NOT EXISTS container_status_logs (
    status_log_id    VARCHAR(50) PRIMARY KEY,
    container_id     VARCHAR(50) REFERENCES containers(container_id),
    status_code      VARCHAR(50),
    location_name    VARCHAR(200),
    scanned_by       VARCHAR(50) REFERENCES users(user_id),
    scanned_at       TIMESTAMP,
    remarks          TEXT,
    blockchain_tx_id VARCHAR(50) REFERENCES blockchain_transactions(blockchain_tx_id)
);

-- 13. Entitas EBL Tokens
CREATE TABLE IF NOT EXISTS ebl_tokens (
    ebl_token_id         VARCHAR(50) PRIMARY KEY,
    document_id          VARCHAR(50) REFERENCES documents(document_id),
    token_number         VARCHAR(100),
    current_owner_org_id VARCHAR(50) REFERENCES organizations(organization_id),
    token_status         VARCHAR(50),
    issued_at            TIMESTAMP,
    blockchain_tx_id     VARCHAR(50) REFERENCES blockchain_transactions(blockchain_tx_id)
);

-- 14. Entitas EBL Transfers
CREATE TABLE IF NOT EXISTS ebl_transfers (
    ebl_transfer_id  VARCHAR(50) PRIMARY KEY,
    ebl_token_id     VARCHAR(50) REFERENCES ebl_tokens(ebl_token_id),
    from_org_id      VARCHAR(50) REFERENCES organizations(organization_id),
    to_org_id        VARCHAR(50) REFERENCES organizations(organization_id),
    transfer_reason  TEXT,
    transferred_by   VARCHAR(50) REFERENCES users(user_id),
    transferred_at   TIMESTAMP,
    blockchain_tx_id VARCHAR(50) REFERENCES blockchain_transactions(blockchain_tx_id)
);

-- pgAudit Simulation via Trigger (Terkait Logic Layer Go Backend)
CREATE OR REPLACE FUNCTION notify_pgaudit_event() RETURNS TRIGGER AS $$
DECLARE
  payload TEXT;
BEGIN
  payload := '{"table": "' || TG_TABLE_NAME || '", "action": "' || TG_OP || '", "timestamp": "' || CURRENT_TIMESTAMP || '"}';
  PERFORM pg_notify('pgaudit_events', payload);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_shipments_trigger
AFTER INSERT OR UPDATE OR DELETE ON shipments
FOR EACH ROW EXECUTE FUNCTION notify_pgaudit_event();

-- Initial Seed Data (Organisasi Saja)
INSERT INTO organizations (organization_id, organization_name, organization_type) VALUES
  ('org-001', 'Port Authority Jakarta', 'Port Authority'),
  ('org-002', 'Indonesia Customs', 'Customs'),
  ('org-003', 'Banking Corp', 'Banking')
ON CONFLICT DO NOTHING;

-- Initial Seed Users
-- The password hash below corresponds to 'admin123' using bcrypt with cost 10
INSERT INTO users (user_id, organization_id, full_name, email, password_hash, role_name) VALUES
  ('user-001', 'org-001', 'Port Admin', 'admin@port.co.id', '$2b$10$eX8A8GvKcIlyuDch28pjF.LVX17rCIWyUM6GbCjEgYyp4Mg.7WoPG', 'PORT_ADMIN'),
  ('user-002', 'org-002', 'Customs Admin', 'admin@beacukai.co.id', '$2b$10$eX8A8GvKcIlyuDch28pjF.LVX17rCIWyUM6GbCjEgYyp4Mg.7WoPG', 'CUSTOMS_OFFICER'),
  ('user-003', 'org-003', 'Bank Admin', 'admin@bank.co.id', '$2b$10$eX8A8GvKcIlyuDch28pjF.LVX17rCIWyUM6GbCjEgYyp4Mg.7WoPG', 'BANK_ADMIN')
ON CONFLICT DO NOTHING;
