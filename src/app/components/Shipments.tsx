import React, { useState, useEffect, Fragment } from 'react';
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

  // Container State
  const [showContainerDialog, setShowContainerDialog] = useState(false);
  const [selectedShipmentId, setSelectedShipmentId] = useState('');
  const [containerData, setContainerData] = useState({
    container_number: '',
    size_ft: '20ft',
    container_type: 'Dry',
    seal_number: '',
    gross_weight: ''
  });

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

  const handleCreateContainer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        shipment_id: selectedShipmentId,
        ...containerData,
        gross_weight: Number(containerData.gross_weight)
      };

      const response = await fetch('http://localhost:3001/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "CreateContainer",
          params: payload,
          id: 5
        })
      });
      const data = await response.json();
      
      if (data.result) {
        alert(`Container berhasil dicatat di PostgreSQL dan Blockchain!\nTxID: ${data.result.txId}`);
        setShowContainerDialog(false);
        fetchShipments(); // Refresh table to show new container
        setContainerData({
          container_number: '',
          size_ft: '20ft',
          container_type: 'Dry',
          seal_number: '',
          gross_weight: ''
        });
      } else {
        alert('Gagal membuat container');
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

  const handleVerifyEndToEnd = async (shipmentId: string) => {
    setIsVerifying(true);
    setVerificationData(null);
    try {
      const response = await fetch('http://localhost:3001/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "VerifyEndToEndFlow",
          params: [shipmentId],
          id: 4
        })
      });
      const data = await response.json();
      if (data.result !== undefined) {
        setVerificationData({ "Status Verifikasi End-to-End": data.result ? "Valid dan Terintegrasi" : "Tidak Lengkap/Invalid" });
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
                  <Fragment key={shipment.shipment_id}>
                    <tr className="hover:bg-gray-50 transition-colors">
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
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => handleVerifyBlockchain(shipment.shipment_id)}
                          className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-md text-xs font-medium border border-green-200 transition-colors text-center"
                        >
                          Cek Blockchain
                        </button>
                        <button 
                          onClick={() => handleVerifyEndToEnd(shipment.shipment_id)}
                          className="px-3 py-1 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-md text-xs font-medium border border-purple-200 transition-colors text-center"
                        >
                          Verifikasi End-to-End
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedShipmentId(shipment.shipment_id);
                            setShowContainerDialog(true);
                          }}
                          className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md text-xs font-medium border border-blue-200 transition-colors text-center"
                        >
                          + Container
                        </button>
                      </div>
                    </td>
                  </tr>
                  {shipment.containers && shipment.containers.length > 0 && (
                    <tr className="bg-blue-50/50">
                      <td colSpan={8} className="px-6 py-3 border-t border-blue-100">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 text-sm font-semibold text-blue-800">
                            <Package className="w-4 h-4" />
                            Daftar Container ({shipment.containers.length})
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {shipment.containers.map((c: any) => (
                              <div key={c.container_id} className="bg-white border border-blue-200 rounded-lg p-3 text-sm shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="font-mono font-bold text-gray-900">{c.container_number}</span>
                                  <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-medium">
                                    {c.size_ft} {c.container_type}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-gray-600">
                                  <span className="text-gray-500">Seal:</span>
                                  <span className="font-medium text-right text-gray-900">{c.seal_number}</span>
                                  <span className="text-gray-500">Weight:</span>
                                  <span className="font-medium text-right text-gray-900">{c.gross_weight} kg</span>
                                  <span className="text-gray-500">Status:</span>
                                  <span className="font-medium text-right text-green-600">{c.container_status}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>
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

      {/* Create Container Dialog */}
      {showContainerDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Tambah Container Baru</h3>
              <p className="text-sm text-gray-600 mt-1">Isi detail container untuk shipment yang dipilih</p>
            </div>
            
            <form onSubmit={handleCreateContainer} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">No Container</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    value={containerData.container_number}
                    onChange={e => setContainerData({...containerData, container_number: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ukuran</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    value={containerData.size_ft}
                    onChange={e => setContainerData({...containerData, size_ft: e.target.value})}
                  >
                    <option value="20ft">20ft</option>
                    <option value="40ft">40ft</option>
                    <option value="45ft">45ft</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Container</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    value={containerData.container_type}
                    onChange={e => setContainerData({...containerData, container_type: e.target.value})}
                  >
                    <option value="Dry">Dry</option>
                    <option value="Reefer">Reefer</option>
                    <option value="Open Top">Open Top</option>
                    <option value="Flat Rack">Flat Rack</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">No Segel (Seal)</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    value={containerData.seal_number}
                    onChange={e => setContainerData({...containerData, seal_number: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Berat Kotor (kg)</label>
                  <input
                    type="number"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    value={containerData.gross_weight}
                    onChange={e => setContainerData({...containerData, gross_weight: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowContainerDialog(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Buat Container (Kirim Tx)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
