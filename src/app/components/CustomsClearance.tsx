import { useState } from 'react';
import { Search, Shield, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { mockCustomsClearance, mockShipments } from '../data/portData';

export function CustomsClearance() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredClearances = mockCustomsClearance.filter(clearance => {
    const shipment = mockShipments.find(s => s.shipment_id === clearance.shipment_id);
    const matchesSearch = 
      clearance.pib_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment?.shipment_code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || clearance.customs_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleApprove = (clearanceId: string) => {
    alert(`Customs clearance ${clearanceId} akan di-approve!\n\nProses:\n1. Update status di PostgreSQL\n2. Record transaksi di Hyperledger Fabric\n3. Chaincode: customs-cc\n4. Function: UpdateCustomsStatus`);
  };

  const handleReject = (clearanceId: string) => {
    alert(`Customs clearance ${clearanceId} akan di-reject!\n\nProses:\n1. Update status di PostgreSQL\n2. Record transaksi di Hyperledger Fabric\n3. Chaincode: customs-cc\n4. Function: UpdateCustomsStatus`);
  };

  const statusStats = {
    pending: mockCustomsClearance.filter(c => c.customs_status === 'pending').length,
    approved: mockCustomsClearance.filter(c => c.customs_status === 'approved').length,
    inspection: mockCustomsClearance.filter(c => c.customs_status === 'inspection').length,
    rejected: mockCustomsClearance.filter(c => c.customs_status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Customs Clearance</h2>
        <p className="text-gray-600 mt-1">Manajemen perizinan bea cukai</p>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan PIB number atau kode shipment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="inspection">Inspection</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{statusStats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{statusStats.approved}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Inspection</p>
              <p className="text-2xl font-bold text-blue-600">{statusStats.inspection}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{statusStats.rejected}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Clearances List */}
      <div className="space-y-4">
        {filteredClearances.map((clearance) => {
          const shipment = mockShipments.find(s => s.shipment_id === clearance.shipment_id);
          
          return (
            <div key={clearance.customs_clearance_id} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    clearance.customs_status === 'approved' ? 'bg-green-100' :
                    clearance.customs_status === 'pending' ? 'bg-yellow-100' :
                    clearance.customs_status === 'inspection' ? 'bg-blue-100' :
                    'bg-red-100'
                  }`}>
                    <Shield className={`w-6 h-6 ${
                      clearance.customs_status === 'approved' ? 'text-green-600' :
                      clearance.customs_status === 'pending' ? 'text-yellow-600' :
                      clearance.customs_status === 'inspection' ? 'text-blue-600' :
                      'text-red-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{clearance.pib_number}</h3>
                    <p className="text-sm text-gray-600 mt-0.5">
                      Shipment: <span className="font-mono text-blue-600">{shipment?.shipment_code}</span>
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  clearance.customs_status === 'approved' ? 'bg-green-100 text-green-800' :
                  clearance.customs_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  clearance.customs_status === 'inspection' ? 'bg-blue-100 text-blue-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {clearance.customs_status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-600">Kantor Bea Cukai</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{clearance.customs_office}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Tanggal Dibuat</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {new Date(clearance.created_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
                {clearance.decided_at && (
                  <div>
                    <p className="text-xs text-gray-600">Tanggal Diputuskan</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {new Date(clearance.decided_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                )}
              </div>

              {shipment && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-xs text-gray-600 mb-2">Detail Shipment</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Kapal</p>
                      <p className="font-medium text-gray-900">{shipment.vessel_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Rute</p>
                      <p className="font-medium text-gray-900">{shipment.origin_port} → {shipment.destination_port}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Barang</p>
                      <p className="font-medium text-gray-900">{shipment.goods_description}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Berat</p>
                      <p className="font-medium text-gray-900">{shipment.total_weight_kg.toLocaleString()} kg</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-600">
                  Blockchain TX: <span className="font-mono text-blue-600">{clearance.blockchain_tx_id}</span>
                </div>
                {clearance.customs_status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReject(clearance.customs_clearance_id)}
                      className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(clearance.customs_clearance_id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Approve
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredClearances.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Tidak ada customs clearance ditemukan</p>
        </div>
      )}
    </div>
  );
}
