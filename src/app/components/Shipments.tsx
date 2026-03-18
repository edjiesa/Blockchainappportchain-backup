import { useState } from 'react';
import { Search, Filter, Plus, Anchor, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { mockShipments, mockContainers, mockOrganizations } from '../data/portData';

export function Shipments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const itemsPerPage = 10;

  const filteredShipments = mockShipments.filter(ship =>
    ship.shipment_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ship.vessel_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ship.exporter_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ship.importer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredShipments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedShipments = filteredShipments.slice(startIndex, startIndex + itemsPerPage);

  const handleCreateShipment = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Shipment akan dibuat dan dicatat di Hyperledger Fabric blockchain!\n\nData akan disimpan di:\n- PostgreSQL (off-chain)\n- Hyperledger Fabric (on-chain)\n\nChaincode: portchain-cc\nFunction: CreateShipment');
    setShowCreateDialog(false);
  };

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

      {/* Search Bar */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan kode shipment, kapal, eksportir, atau importir..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-600">Total Shipments</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{mockShipments.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-600">Total Containers</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{mockContainers.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-600">Total Berat</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {(mockShipments.reduce((acc, s) => acc + s.total_weight_kg, 0) / 1000).toFixed(1)} ton
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-600">Shipment Bulan Ini</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {mockShipments.filter(s => {
              const now = new Date();
              const shipDate = new Date(s.created_at);
              return shipDate.getMonth() === now.getMonth() && shipDate.getFullYear() === now.getFullYear();
            }).length}
          </p>
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
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase">Barang</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase">Berat</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedShipments.map((shipment) => {
                const containerCount = mockContainers.filter(c => c.shipment_id === shipment.shipment_id).length;
                return (
                  <tr key={shipment.shipment_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Anchor className="w-4 h-4 text-blue-600" />
                        <span className="font-mono font-medium text-blue-600">
                          {shipment.shipment_code}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Package className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-600">{containerCount} container</span>
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
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {shipment.exporter_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {shipment.importer_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {shipment.goods_description}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {shipment.total_weight_kg.toLocaleString()} kg
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {new Date(shipment.created_at).toLocaleDateString('id-ID')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Menampilkan {startIndex + 1} sampai {Math.min(startIndex + itemsPerPage, filteredShipments.length)} dari {filteredShipments.length} shipment
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-600">
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Create Shipment Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Buat Shipment Baru</h3>
            
            <form onSubmit={handleCreateShipment} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Eksportir
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="PT Export Indonesia"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Importir
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="PT Import Indonesia"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shipping Line
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Maersk"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Kapal
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="MV Pacific"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pelabuhan Asal
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Singapore"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pelabuhan Tujuan
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Jakarta"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deskripsi Barang
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Electronics"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Berat (kg)
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="25000"
                  required
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
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
                  Buat Shipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
