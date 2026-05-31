import { useState, useEffect } from 'react';
import { Search, Shield, CheckCircle, XCircle, Clock, Eye, Plus, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function CustomsClearance() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [shipments, setShipments] = useState<any[]>([]);
  const [customsClearances, setCustomsClearances] = useState<any[]>([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      // Fetch Shipments
      const shipRes = await fetch(`${API_URL}/rpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'GetAllShipments', params: {}, id: Date.now() })
      });
      const shipData = await shipRes.json();
      if (shipData.result) setShipments(shipData.result);

      // Fetch Clearances
      const clearRes = await fetch(`${API_URL}/rpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'GetCustomsClearances', params: {}, id: Date.now() })
      });
      const clearData = await clearRes.json();
      if (clearData.result) setCustomsClearances(clearData.result);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredClearances = customsClearances.filter(clearance => {
    const shipment = shipments.find(s => s.shipment_id === clearance.shipment_id);
    const matchesSearch = 
      clearance.pib_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment?.shipment_code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || clearance.customs_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleApprove = async (clearanceId: string) => {
    try {
      await fetch(`${API_URL}/rpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'UpdateCustomsStatus', params: { customs_clearance_id: clearanceId, status: 'approved' }, id: Date.now() })
      });
      await fetchData();
    } catch (err) {
      console.error("Failed to approve", err);
    }
  };

  const handleReject = async (clearanceId: string) => {
    try {
      await fetch(`${API_URL}/rpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'UpdateCustomsStatus', params: { customs_clearance_id: clearanceId, status: 'rejected' }, id: Date.now() })
      });
      await fetchData();
    } catch (err) {
      console.error("Failed to reject", err);
    }
  };

  const handleSubmitPIB = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    try {
      await fetch(`${API_URL}/rpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'CreateCustomsClearance',
          params: { shipment_id: formData.get('shipment_id'), pib_number: formData.get('pib_number') },
          id: Date.now()
        })
      });
      setShowSubmitModal(false);
      await fetchData();
    } catch (err) {
      console.error("Failed to submit PIB", err);
      alert("Failed to submit");
    }
  };

  const statusStats = {
    pending: customsClearances.filter(c => c.customs_status === 'pending').length,
    approved: customsClearances.filter(c => c.customs_status === 'approved').length,
    inspection: customsClearances.filter(c => c.customs_status === 'inspection').length,
    rejected: customsClearances.filter(c => c.customs_status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Customs Clearance</h2>
          <p className="text-gray-600 mt-1">Manajemen perizinan bea cukai</p>
        </div>
        <button 
          onClick={() => setShowSubmitModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Submit PIB
        </button>
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
        {isLoading ? (
           <div className="text-center py-12 text-gray-500">Loading data...</div>
        ) : filteredClearances.map((clearance) => {
          const shipment = shipments.find(s => s.shipment_id === clearance.shipment_id);
          
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

      {!isLoading && filteredClearances.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Tidak ada customs clearance ditemukan</p>
        </div>
      )}

      {/* MODAL SUBMIT PIB */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Submit Dokumen PIB</h3>
              <button onClick={() => setShowSubmitModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmitPIB} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Shipment</label>
                  <select name="shipment_id" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600">
                    <option value="">-- Pilih Shipment --</option>
                    {shipments.map(s => (
                      <option key={s.shipment_id} value={s.shipment_id}>
                        {s.shipment_code} - {s.goods_description} ({s.origin_port} &rarr; {s.destination_port})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nomor PIB (Pemberitahuan Impor Barang)</label>
                  <input type="text" name="pib_number" required placeholder="Contoh: PIB-20260531-ABC" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600" />
                </div>
                <div className="pt-4">
                  <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                    Submit ke Bea Cukai
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
