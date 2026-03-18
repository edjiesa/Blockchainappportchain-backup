import type {
  Organization,
  User,
  Shipment,
  Container,
  CustomsClearance,
  Certificate,
  Document,
  EBLToken,
  BlockchainTransaction,
  AuditLog,
  DashboardStats
} from '../types/port';

// Organizations (Port Authorities, Customs, Shipping Lines)
export const mockOrganizations: Organization[] = [
  {
    organization_id: 'org-001',
    organization_name: 'Port Authority Jakarta',
    organization_type: 'Port Authority',
    channel_id: 'port-channel'
  },
  {
    organization_id: 'org-002',
    organization_name: 'Indonesia Customs',
    organization_type: 'Customs',
    channel_id: 'port-channel'
  },
  {
    organization_id: 'org-003',
    organization_name: 'Maersk Shipping',
    organization_type: 'Shipping Line',
    channel_id: 'port-channel'
  },
  {
    organization_id: 'org-004',
    organization_name: 'PT Pelindo',
    organization_type: 'Terminal Operator',
    channel_id: 'port-channel'
  }
];

// Users
export const mockUsers: User[] = [
  {
    user_id: 'user-001',
    organization_id: 'org-001',
    username: 'admin.port',
    email: 'admin@portjakarta.id',
    role_name: 'Port Administrator',
    created_at: new Date('2024-01-15')
  },
  {
    user_id: 'user-002',
    organization_id: 'org-002',
    username: 'officer.customs',
    email: 'officer@customs.go.id',
    role_name: 'Customs Officer',
    created_at: new Date('2024-01-20')
  },
  {
    user_id: 'user-003',
    organization_id: 'org-003',
    username: 'agent.maersk',
    email: 'agent@maersk.com',
    role_name: 'Shipping Agent',
    created_at: new Date('2024-02-01')
  }
];

// Shipments
export const mockShipments: Shipment[] = Array.from({ length: 25 }, (_, i) => ({
  shipment_id: `ship-${String(i + 1).padStart(3, '0')}`,
  user_id: `user-00${(i % 3) + 1}`,
  shipment_code: `SHP${new Date().getFullYear()}${String(1000 + i).substring(1)}`,
  exporter_name: ['PT Export Indo', 'CV Global Trade', 'UD Maju Jaya'][i % 3],
  importer_name: ['PT Import Sejahtera', 'CV Niaga Utama', 'PT Karya Mandiri'][i % 3],
  shipping_line_name: ['Maersk', 'MSC', 'CMA CGM', 'Evergreen'][i % 4],
  vessel_name: ['MV Pacific', 'MV Atlantic', 'MV Indian Ocean', 'MV Nusantara'][i % 4],
  goods_description: ['Electronics', 'Textiles', 'Machinery', 'Raw Materials', 'Consumer Goods'][i % 5],
  origin_port: ['Shanghai', 'Singapore', 'Rotterdam', 'Los Angeles'][i % 4],
  destination_port: 'Jakarta',
  total_weight_kg: Math.floor(Math.random() * 50000) + 10000,
  created_by: `user-00${(i % 3) + 1}`,
  created_at: new Date(Date.now() - (25 - i) * 86400000),
  updated_at: new Date(Date.now() - (25 - i) * 43200000)
}));

// Containers
export const mockContainers: Container[] = mockShipments.flatMap((ship, idx) => 
  Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, i) => ({
    container_id: `cont-${idx}-${i}`,
    shipment_id: ship.shipment_id,
    container_number: `${['MSCU', 'CMAU', 'EISU', 'TEMU'][i % 4]}${Math.random().toString().substring(2, 9)}`,
    container_type: ['Dry', 'Reefer', 'Tank', 'Flat Rack'][i % 4],
    container_size: ['20ft', '40ft', '40ft HC'][i % 3],
    seal_number: `SEAL${Math.random().toString().substring(2, 10)}`,
    gross_weight_kg: Math.floor(Math.random() * 20000) + 5000,
    created_at: ship.created_at
  }))
);

// Customs Clearance
export const mockCustomsClearance: CustomsClearance[] = mockShipments.slice(0, 20).map((ship, i) => ({
  customs_clearance_id: `cust-${String(i + 1).padStart(3, '0')}`,
  shipment_id: ship.shipment_id,
  pib_number: `PIB${new Date().getFullYear()}${String(10000 + i).substring(1)}`,
  customs_status: ['pending', 'approved', 'rejected', 'inspection'][
    i < 5 ? 0 : i < 15 ? 1 : i < 18 ? 3 : 2
  ] as any,
  customs_office: 'Kantor Bea Cukai Tanjung Priok',
  decided_by: i >= 5 ? 'user-002' : '',
  decided_at: i >= 5 ? new Date(Date.now() - (20 - i) * 21600000) : undefined,
  created_at: ship.created_at,
  blockchain_tx_id: `tx-cust-${i + 1}`
}));

// Certificates
export const mockCertificates: Certificate[] = Array.from({ length: 15 }, (_, i) => ({
  certificate_id: `cert-${String(i + 1).padStart(3, '0')}`,
  user_id: `user-00${(i % 3) + 1}`,
  certificate_serial_number: `CERT-${new Date().getFullYear()}-${String(1000 + i).substring(1)}`,
  certificate_subject: ['Import License', 'Export License', 'Health Certificate', 'Quality Certificate'][i % 4],
  certificate_type: ['Digital', 'Physical'][i % 2],
  valid_from: new Date(Date.now() - 30 * 86400000),
  valid_until: new Date(Date.now() + 335 * 86400000),
  created_at: new Date(Date.now() - 30 * 86400000)
}));

// Documents
export const mockDocuments: Document[] = mockShipments.slice(0, 20).flatMap((ship, idx) =>
  ['Bill of Lading', 'Commercial Invoice', 'Packing List', 'Certificate of Origin'].map((docType, i) => ({
    document_id: `doc-${idx}-${i}`,
    shipment_id: ship.shipment_id,
    uploaded_by: ship.user_id,
    document_type: docType,
    document_category: ['Shipping', 'Commercial', 'Commercial', 'Customs'][i],
    document_title: `${docType} - ${ship.shipment_code}`,
    document_version: 'v1.0',
    access_control: 'authorized',
    issued_date: ship.created_at,
    uploaded_at: new Date(ship.created_at.getTime() + 3600000)
  }))
);

// EBL Tokens (Electronic Bill of Lading)
export const mockEBLTokens: EBLToken[] = mockShipments.slice(0, 15).map((ship, i) => ({
  ebl_token_id: `ebl-${String(i + 1).padStart(3, '0')}`,
  document_id: `doc-${i}-0`,
  token_number: `EBL${new Date().getFullYear()}${String(10000 + i).substring(1)}`,
  current_owner_org_id: i % 2 === 0 ? 'org-003' : 'org-001',
  original_issuer_org_id: 'org-003',
  issued_at: ship.created_at,
  blockchain_tx_id: `tx-ebl-${i + 1}`
}));

// Blockchain Transactions (Hyperledger Fabric)
export const mockBlockchainTransactions: BlockchainTransaction[] = Array.from({ length: 50 }, (_, i) => ({
  blockchain_tx_id: `tx-${String(i + 1).padStart(4, '0')}`,
  tx_id: `${Math.random().toString(16).substring(2, 66)}`,
  channel_name: 'port-channel',
  chaincode_name: ['portchain-cc', 'customs-cc', 'ebl-cc'][i % 3],
  function_name: ['CreateShipment', 'UpdateCustomsStatus', 'TransferEBL', 'UploadDocument', 'CreateContainer'][i % 5],
  validation_status: i < 48 ? 'VALID' : 'INVALID',
  block_number: 100000 + i,
  timestamp: new Date(Date.now() - (50 - i) * 60000),
  created_at: new Date(Date.now() - (50 - i) * 60000)
}));

// Audit Logs
export const mockAuditLogs: AuditLog[] = Array.from({ length: 30 }, (_, i) => ({
  audit_log_id: `audit-${String(i + 1).padStart(4, '0')}`,
  user_id: `user-00${(i % 3) + 1}`,
  entity_id: `ship-${String((i % 25) + 1).padStart(3, '0')}`,
  actor_type: 'User',
  action_description: [
    'Created shipment',
    'Updated customs status',
    'Uploaded document',
    'Transferred EBL',
    'Added container'
  ][i % 5],
  action_timestamp: new Date(Date.now() - (30 - i) * 120000),
  blockchain_tx_id: `tx-${String((i % 50) + 1).padStart(4, '0')}`,
  sync_status: i < 28 ? 'synced' : 'pending'
}));

// Dashboard Statistics
export const mockDashboardStats: DashboardStats = {
  totalShipments: mockShipments.length,
  pendingCustoms: mockCustomsClearance.filter(c => c.customs_status === 'pending').length,
  approvedCustoms: mockCustomsClearance.filter(c => c.customs_status === 'approved').length,
  activeContainers: mockContainers.length,
  totalDocuments: mockDocuments.length,
  activeEBLs: mockEBLTokens.length,
  totalTransactions: mockBlockchainTransactions.length,
  channelNodes: 4
};

// Historical data for charts
export const mockShipmentTrends = Array.from({ length: 7 }, (_, i) => ({
  id: `trend-${i}`,
  day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i],
  shipments: Math.floor(Math.random() * 10) + 5,
  clearances: Math.floor(Math.random() * 8) + 3,
  documents: Math.floor(Math.random() * 30) + 15
}));

export const mockCustomsStats = [
  { id: 'approved', status: 'Approved', count: mockCustomsClearance.filter(c => c.customs_status === 'approved').length, color: '#10b981' },
  { id: 'pending', status: 'Pending', count: mockCustomsClearance.filter(c => c.customs_status === 'pending').length, color: '#f59e0b' },
  { id: 'inspection', status: 'Inspection', count: mockCustomsClearance.filter(c => c.customs_status === 'inspection').length, color: '#3b82f6' },
  { id: 'rejected', status: 'Rejected', count: mockCustomsClearance.filter(c => c.customs_status === 'rejected').length, color: '#ef4444' }
];