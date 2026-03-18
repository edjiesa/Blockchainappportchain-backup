// Based on ERD for Port Licensing System with Hyperledger Fabric

export interface Organization {
  organization_id: string;
  organization_name: string;
  organization_type: string;
  channel_id: string;
}

export interface User {
  user_id: string;
  organization_id: string;
  username: string;
  email: string;
  role_name: string;
  created_at: Date;
}

export interface Shipment {
  shipment_id: string;
  user_id: string;
  shipment_code: string;
  exporter_name: string;
  importer_name: string;
  shipping_line_name: string;
  vessel_name: string;
  goods_description: string;
  origin_port: string;
  destination_port: string;
  total_weight_kg: number;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface Container {
  container_id: string;
  shipment_id: string;
  container_number: string;
  container_type: string;
  container_size: string;
  seal_number: string;
  gross_weight_kg: number;
  created_at: Date;
}

export interface CustomsClearance {
  customs_clearance_id: string;
  shipment_id: string;
  pib_number: string;
  customs_status: 'pending' | 'approved' | 'rejected' | 'inspection';
  customs_office: string;
  decided_by: string;
  decided_at?: Date;
  created_at: Date;
  blockchain_tx_id: string;
}

export interface Certificate {
  certificate_id: string;
  user_id: string;
  certificate_serial_number: string;
  certificate_subject: string;
  certificate_type: string;
  valid_from: Date;
  valid_until: Date;
  revoked_at?: Date;
  created_at: Date;
}

export interface Document {
  document_id: string;
  shipment_id: string;
  uploaded_by: string;
  document_type: string;
  document_category: string;
  document_title: string;
  document_version: string;
  access_control: string;
  issued_date: Date;
  uploaded_at: Date;
}

export interface EBLToken {
  ebl_token_id: string;
  document_id: string;
  token_number: string;
  current_owner_org_id: string;
  original_issuer_org_id: string;
  issued_at: Date;
  blockchain_tx_id: string;
}

export interface BlockchainTransaction {
  blockchain_tx_id: string;
  tx_id: string;
  channel_name: string;
  chaincode_name: string;
  function_name: string;
  validation_status: string;
  block_number: number;
  timestamp: Date;
  created_at: Date;
}

export interface AuditLog {
  audit_log_id: string;
  user_id: string;
  entity_id: string;
  actor_type: string;
  action_description: string;
  old_value?: string;
  new_value?: string;
  action_timestamp: Date;
  blockchain_tx_id: string;
  sync_status: string;
}

export interface DashboardStats {
  totalShipments: number;
  pendingCustoms: number;
  approvedCustoms: number;
  activeContainers: number;
  totalDocuments: number;
  activeEBLs: number;
  totalTransactions: number;
  channelNodes: number;
}
