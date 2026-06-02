import { useState, useEffect } from 'react';
import { Search, Plus, Anchor, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { mockContainers } from '../data/portData';

export function Shipments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [shipments, setShipments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Verification State
  const [verificationData, setVerificationData] = useState<any | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const itemsPerPage = 10;

  // Form State
  const [formData, setFormData] = useState({
    shipment_code: '',
    exporter_name: '',
    importer_name: '',
    shipping_line_name: '',
    vessel_name: '',
    origin_port: '',
    destination_port: '',
    total_weight_kg: '',
    goods_description: ''
  });

  const fetchShipments = async () => {
    try {
      const response = await fetch('http://localhost:3001/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "GetAllShipments",
          params: {},
          id: 1
        })
      });
      const data = await response.json();
      if (data.result) {
        setShipments(data.result);
      }
    } catch (error) {
      console.error("Failed to fetch shipments", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        total_weight_kg: Number(formData.total_weight_kg)
      };

      const response = await fetch('http://localhost:3001/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "CreateShipment",
          params: payload,
          id: 2
        })
      });
      const data = await response.json();
      
      if (data.result) {
        alert(`Shipment berhasil dicatat di PostgreSQL dan Blockchain!\nTxID: ${data.result.txId || 'Terverifikasi'}`);
        setShowCreateDialog(false);
        fetchShipments(); // Refresh table
      } else {
        alert('Gagal membuat shipment');
      }
    } catch (error) {
      console.error(error);
      alert('Network error');
    }
  };

  const handleVerifyBlockchain = async (shipmentId: string) => {
    setIsVerifying(true);
    setVerificationData(null);
    try {
      const response = await fetch('http://localhost:3001/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "GetShipment",
          params: [shipmentId],
          id: 3
        })
      });
      const data = await response.json();
      if (data.result) {
        setVerificationData(data.result);
      } else if (data.error) {
        setVerificationData({ error: data.error.message || JSON.stringify(data.error) });
      } else {
        setVerificationData({ error: 'Data tidak ditemukan di blockchain' });
      }
    } catch (error) {
      setVerificationData({ error: 'Gagal terhubung ke jaringan blockchain' });
    } finally {
      setIsVerifying(false);
    }
  };

  const filteredShipments = shipments.filter(ship =>
    (ship.shipment_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ship.vessel_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ship.exporter_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ship.importer_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredShipments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedShipments = filteredShipments.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Manajemen Shipment</h2>
          <p className="text-gray-600 mt-1">Kelola data pengiriman barang pelabuhan</p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Buat Shipment
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-600">Total Shipments</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{shipments.length}</p>
        </div>
      </div>

      {/* Shipments Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase">Kode Shipment</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase">Kapal</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase">Rute</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase">Eksportir</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase">Importir</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase">Tanggal</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={7} className="px-6 py-4 text-center">Loading...</td></tr>
              ) : paginatedShipments.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-4 text-center">Belum ada data shipment</td></tr>
              ) : (
                paginatedShipments.map((shipment) => (
                  <tr key={shipment.shipment_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Anchor className="w-4 h-4 text-blue-600" />
                        <span className="font-mono font-medium text-blue-600">
                          {shipment.shipment_code}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{shipment.vessel_name}</p>
                      <p className="text-xs text-gray-600">{shipment.shipping_line_name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{shipment.origin_port}</p>
                      <p className="text-xs text-gray-600">→ {shipment.destination_port}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{shipment.exporter_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{shipment.importer_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{shipment.shipment_status}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {new Date(shipment.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleVerifyBlockchain(shipment.shipment_id)}
                        className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-md text-xs font-medium border border-green-200 transition-colors"
                      >
                        Cek Blockchain
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification Modal */}
      {(isVerifying || verificationData) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500 inline-block animate-pulse"></span>
              Node Fabric Verifier
            </h3>
            
            {isVerifying ? (
              <div className="py-8 text-center text-gray-600">
                <p>Mengambil data langsung dari Hyperledger Fabric...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                    {JSON.stringify(verificationData, null, 2)}
                  </pre>
                </div>
                {verificationData && !verificationData.error && (
                  <p className="text-sm text-green-600 font-medium">✓ Data valid dan tidak dapat diubah (Immutable)</p>
                )}
                <div className="pt-4 text-right">
                  <button
                    onClick={() => setVerificationData(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Shipment Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Buat Shipment Baru</h3>
            
            <form onSubmit={handleCreateShipment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kode Shipment</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  value={formData.shipment_code}
                  onChange={e => setFormData({...formData, shipment_code: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nama Eksportir</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    value={formData.exporter_name}
                    onChange={e => setFormData({...formData, exporter_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nama Importir</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    value={formData.importer_name}
                    onChange={e => setFormData({...formData, importer_name: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Shipping Line</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    value={formData.shipping_line_name}
                    onChange={e => setFormData({...formData, shipping_line_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nama Kapal</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    value={formData.vessel_name}
                    onChange={e => setFormData({...formData, vessel_name: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pelabuhan Asal</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    value={formData.origin_port}
                    onChange={e => setFormData({...formData, origin_port: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pelabuhan Tujuan</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    value={formData.destination_port}
                    onChange={e => setFormData({...formData, destination_port: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi Barang</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    value={formData.goods_description}
                    onChange={e => setFormData({...formData, goods_description: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Berat (kg)</label>
                  <input
                    type="number"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    value={formData.total_weight_kg}
                    onChange={e => setFormData({...formData, total_weight_kg: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-blue-800">
                  <strong>Hyperledger Fabric Integration:</strong> Shipment akan dicatat di blockchain dan PostgreSQL database
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateDialog(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Buat Shipment (Kirim Tx)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
