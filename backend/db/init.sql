-- =====================================================
-- PortChain Off-Chain Database Schema (PostgreSQL)
-- =====================================================

-- Extension for AES-256 encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
    organization_id   VARCHAR(50) PRIMARY KEY,
    organization_name VARCHAR(200) NOT NULL,
    organization_type VARCHAR(100) NOT NULL,
    channel_id        VARCHAR(100),
    created_at        TIMESTAMP DEFAULT NOW()
);

-- Users
CREATE TABLE IF NOT EXISTS users (
    user_id         VARCHAR(50) PRIMARY KEY,
    organization_id VARCHAR(50) REFERENCES organizations(organization_id),
    username        VARCHAR(100) UNIQUE NOT NULL,
    email           VARCHAR(200) UNIQUE NOT NULL,
    role_name       VARCHAR(100),
    created_at      TIMESTAMP DEFAULT NOW()
);

-- Shipments (data utama pengiriman)
CREATE TABLE IF NOT EXISTS shipments (
    shipment_id       VARCHAR(50) PRIMARY KEY,
    user_id           VARCHAR(50) REFERENCES users(user_id),
    shipment_code     VARCHAR(50) UNIQUE NOT NULL,
    exporter_name     VARCHAR(200),
    importer_name     VARCHAR(200),
    shipping_line_name VARCHAR(200),
    vessel_name       VARCHAR(200),
    goods_description TEXT,
    origin_port       VARCHAR(100),
    destination_port  VARCHAR(100),
    total_weight_kg   DECIMAL(12, 2),
    blockchain_tx_id  VARCHAR(200),
    created_by        VARCHAR(50),
    created_at        TIMESTAMP DEFAULT NOW(),
    updated_at        TIMESTAMP DEFAULT NOW()
);

-- Containers
CREATE TABLE IF NOT EXISTS containers (
    container_id     VARCHAR(50) PRIMARY KEY,
    shipment_id      VARCHAR(50) REFERENCES shipments(shipment_id),
    container_number VARCHAR(50),
    container_type   VARCHAR(20),
    container_size   VARCHAR(10),
    seal_number      VARCHAR(100),
    gross_weight_kg  DECIMAL(12, 2),
    created_at       TIMESTAMP DEFAULT NOW()
);

-- Customs Clearance
CREATE TABLE IF NOT EXISTS customs_clearance (
    customs_clearance_id VARCHAR(50) PRIMARY KEY,
    shipment_id          VARCHAR(50) REFERENCES shipments(shipment_id),
    pib_number           VARCHAR(50),
    customs_status       VARCHAR(20) DEFAULT 'pending',
    customs_office       VARCHAR(200),
    decided_by           VARCHAR(50),
    decided_at           TIMESTAMP,
    blockchain_tx_id     VARCHAR(200),
    created_at           TIMESTAMP DEFAULT NOW()
);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
    document_id       VARCHAR(50) PRIMARY KEY,
    shipment_id       VARCHAR(50) REFERENCES shipments(shipment_id),
    uploaded_by       VARCHAR(50),
    document_type     VARCHAR(100),
    document_category VARCHAR(100),
    document_title    VARCHAR(300),
    document_version  VARCHAR(20) DEFAULT 'v1.0',
    access_control    VARCHAR(50) DEFAULT 'authorized',
    file_hash         VARCHAR(200),
    blockchain_tx_id  VARCHAR(200),
    issued_date       TIMESTAMP,
    uploaded_at       TIMESTAMP DEFAULT NOW()
);

-- EBL Tokens (Electronic Bill of Lading)
CREATE TABLE IF NOT EXISTS ebl_tokens (
    ebl_token_id         VARCHAR(50) PRIMARY KEY,
    document_id          VARCHAR(50) REFERENCES documents(document_id),
    token_number         VARCHAR(50) UNIQUE NOT NULL,
    current_owner_org_id VARCHAR(50) REFERENCES organizations(organization_id),
    original_issuer_org_id VARCHAR(50) REFERENCES organizations(organization_id),
    blockchain_tx_id     VARCHAR(200),
    issued_at            TIMESTAMP DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    audit_log_id     VARCHAR(50) PRIMARY KEY,
    user_id          VARCHAR(50),
    entity_id        VARCHAR(100),
    actor_type       VARCHAR(50),
    action_description TEXT,
    action_timestamp TIMESTAMP DEFAULT NOW(),
    blockchain_tx_id VARCHAR(200),
    sync_status      VARCHAR(20) DEFAULT 'synced'
);

-- pgAudit Simulation via Trigger
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

-- =====================================================
-- Seed Data Awal (Organisasi Port Indonesia)
-- =====================================================
INSERT INTO organizations (organization_id, organization_name, organization_type, channel_id) VALUES
  ('org-001', 'Port Authority Jakarta', 'Port Authority', 'mychannel'),
  ('org-002', 'Indonesia Customs', 'Customs', 'mychannel'),
  ('org-003', 'Maersk Shipping', 'Shipping Line', 'mychannel'),
  ('org-004', 'PT Pelindo', 'Terminal Operator', 'mychannel')
ON CONFLICT (organization_id) DO NOTHING;

INSERT INTO users (user_id, organization_id, username, email, role_name) VALUES
  ('user-001', 'org-001', 'admin.port', 'admin@portjakarta.id', 'Port Administrator'),
  ('user-002', 'org-002', 'officer.customs', 'officer@customs.go.id', 'Customs Officer'),
  ('user-003', 'org-003', 'agent.maersk', 'agent@maersk.com', 'Shipping Agent')
ON CONFLICT (user_id) DO NOTHING;
