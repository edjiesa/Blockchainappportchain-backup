import { useState } from 'react';
import { Search, FileText, Upload, Download, Eye, Hash } from 'lucide-react';
import { mockDocuments, mockShipments } from '../data/portData';

export function Documents() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const filteredDocuments = mockDocuments.filter(doc => {
    const matchesSearch = 
      doc.document_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.document_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || doc.document_category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const handleUploadDocument = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Dokumen akan di-upload!\n\nProses:\n1. Upload file ke storage\n2. Hash dokumen dengan SHA-256\n3. Store metadata di PostgreSQL\n4. Record hash di Hyperledger Fabric\n5. Chaincode: portchain-cc\n6. Function: UploadDocument');
    setShowUploadDialog(false);
  };

  const categories = ['Shipping', 'Commercial', 'Customs', 'Certificate'];
  const documentTypes = [...new Set(mockDocuments.map(d => d.document_type))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Manajemen Dokumen</h2>
          <p className="text-gray-600 mt-1">Kelola dokumen dengan integritas blockchain</p>
        </div>
        <button
          onClick={() => setShowUploadDialog(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Upload className="w-5 h-5" />
          Upload Dokumen
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari dokumen berdasarkan judul atau tipe..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Kategori:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Kategori</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-600">Total Dokumen</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{mockDocuments.length}</p>
        </div>
        {categories.map(cat => (
          <div key={cat} className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-xs text-gray-600">{cat}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {mockDocuments.filter(d => d.document_category === cat).length}
            </p>
          </div>
        ))}
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocuments.slice(0, 30).map((doc) => {
          const shipment = mockShipments.find(s => s.shipment_id === doc.shipment_id);
          
          return (
            <div key={doc.document_id} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  doc.document_category === 'Shipping' ? 'bg-blue-100' :
                  doc.document_category === 'Commercial' ? 'bg-green-100' :
                  doc.document_category === 'Customs' ? 'bg-purple-100' :
                  'bg-orange-100'
                }`}>
                  <FileText className={`w-6 h-6 ${
                    doc.document_category === 'Shipping' ? 'text-blue-600' :
                    doc.document_category === 'Commercial' ? 'text-green-600' :
                    doc.document_category === 'Customs' ? 'text-purple-600' :
                    'text-orange-600'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{doc.document_type}</h3>
                  <p className="text-xs text-gray-600 mt-0.5">{doc.document_category}</p>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-3 line-clamp-2">{doc.document_title}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Shipment</span>
                  <span className="font-mono text-blue-600">{shipment?.shipment_code}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Version</span>
                  <span className="font-medium text-gray-900">{doc.document_version}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Issued</span>
                  <span className="text-gray-900">{new Date(doc.issued_date).toLocaleDateString('id-ID')}</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Hash className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-600">Document Hash (on-chain)</span>
                </div>
                <p className="font-mono text-xs text-gray-700 break-all">
                  {Math.random().toString(16).substring(2, 18)}...
                </p>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <Eye className="w-4 h-4" />
                  View
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredDocuments.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Tidak ada dokumen ditemukan</p>
        </div>
      )}

      {/* Upload Dialog */}
      {showUploadDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Upload Dokumen</h3>
            
            <form onSubmit={handleUploadDocument} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shipment ID
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Pilih Shipment</option>
                  {mockShipments.slice(0, 10).map(ship => (
                    <option key={ship.shipment_id} value={ship.shipment_id}>
                      {ship.shipment_code} - {ship.vessel_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipe Dokumen
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Pilih Tipe</option>
                  {documentTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File
                </label>
                <input
                  type="file"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Blockchain Security:</strong> Hash dokumen akan disimpan di Hyperledger Fabric untuk memastikan integritas
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadDialog(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
