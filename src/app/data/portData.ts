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
// We keep organizations as requested
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
    organization_name: 'Banking Corp',
    organization_type: 'Banking',
    channel_id: 'port-channel'
  }
];

// Users
export const mockUsers: User[] = [];

// Shipments
export const mockShipments: Shipment[] = [];

// Containers
export const mockContainers: Container[] = [];

// Customs Clearance
export const mockCustomsClearance: CustomsClearance[] = [];

// Certificates
export const mockCertificates: Certificate[] = [];

// Documents
export const mockDocuments: Document[] = [];

// EBL Tokens (Electronic Bill of Lading)
export const mockEBLTokens: EBLToken[] = [];

// Blockchain Transactions (Hyperledger Fabric)
export const mockBlockchainTransactions: BlockchainTransaction[] = [];

// Audit Logs
export const mockAuditLogs: AuditLog[] = [];

// Dashboard Statistics
export const mockDashboardStats: DashboardStats = {
  totalShipments: 0,
  pendingCustoms: 0,
  approvedCustoms: 0,
  activeContainers: 0,
  totalDocuments: 0,
  activeEBLs: 0,
  totalTransactions: 0,
  channelNodes: 3
};

// Historical data for charts
export const mockShipmentTrends: any[] = [];
export const mockCustomsStats: any[] = [];