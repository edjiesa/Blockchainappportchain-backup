import { useState, useEffect } from 'react';
import { Search, FileText, Upload, Download, Eye, Hash, Database } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function Documents() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
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

      // Fetch Documents
      const docRes = await fetch(`${API_URL}/rpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'GetDocuments', params: {}, id: Date.now() })
      });
      const docData = await docRes.json();
      if (docData.result) setDocuments(docData.result);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      doc.document_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.document_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || doc.document_title === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
    const file = fileInput.files?.[0];
    
    let fileData = "";
    let fileName = "";
    
    if (file) {
      fileName = file.name;
      // Convert file to base64
      fileData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
      });
    }

    try {
      await fetch(`${API_URL}/rpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'UploadDocument',
          params: { 
            shipment_id: formData.get('shipment_id'), 
            document_type: formData.get('document_type'),
            document_category: formData.get('document_category'),
            file_data: fileData,
            file_name: fileName
          },
          id: Date.now()
        })
      });
      setShowUploadDialog(false);
      await fetchData();
    } catch (err) {
      console.error("Failed to upload document", err);
      alert("Failed to upload");
    }
  };

  const categories = ['Shipping', 'Commercial', 'Customs', 'Certificate'];
  const documentTypes = ['Bill of Lading', 'Commercial Invoice', 'Packing List', 'Certificate of Origin', 'Customs Declaration', 'Insurance Certificate'];

  const [viewingDoc, setViewingDoc] = useState<any>(null);

  const handleView = (doc: any) => {
    setViewingDoc(doc);
  };

  const handleDownload = (doc: any) => {
    const content = `PORTCHAIN DOCUMENT RECORD\n========================\n\nTitle: ${doc.document_title}\nType: ${doc.document_type}\nShipment ID: ${doc.shipment_id}\nVersion: ${doc.document_version}\nHash (on-chain): ${doc.document_hash_value}\nIssued At: ${new Date(doc.issued_date).toLocaleString('id-ID')}\n\n* This is a cryptographically verified document from Portchain *`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.document_type.replace(/\s+/g, '_')}_${doc.document_id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

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
          <p className="text-2xl font-bold text-gray-900 mt-1">{documents.length}</p>
        </div>
        {categories.slice(0, 3).map(cat => (
          <div key={cat} className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-xs text-gray-600">{cat}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {documents.filter(d => d.document_title === cat).length}
            </p>
          </div>
        ))}
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-gray-500">Loading documents...</div>
        ) : filteredDocuments.slice(0, 30).map((doc) => {
          const shipment = shipments.find(s => s.shipment_id === doc.shipment_id);
          
          return (
            <div key={doc.document_id} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow flex flex-col justify-between">
                <div className="flex items-start gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    doc.document_title === 'Shipping' ? 'bg-blue-100' :
                    doc.document_title === 'Commercial' ? 'bg-green-100' :
                    doc.document_title === 'Customs' ? 'bg-purple-100' :
                    'bg-orange-100'
                  }`}>
                    <FileText className={`w-6 h-6 ${
                      doc.document_title === 'Shipping' ? 'text-blue-600' :
                      doc.document_title === 'Commercial' ? 'text-green-600' :
                      doc.document_title === 'Customs' ? 'text-purple-600' :
                      'text-orange-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate" title={doc.document_type}>{doc.document_type}</h3>
                    <p className="text-xs text-gray-600 mt-0.5">{doc.document_title}</p>
                  </div>
                </div>

              <p className="text-sm text-gray-700 mb-3 line-clamp-2">{doc.document_title}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Shipment</span>
                  <span className="font-mono text-blue-600 truncate max-w-[120px]" title={shipment?.shipment_code || 'N/A'}>{shipment?.shipment_code || 'N/A'}</span>
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

              <div className="bg-gray-50 rounded-lg p-3 mb-4 mt-auto">
                <div className="flex items-center gap-2 mb-1">
                  <Hash className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-600">Document Hash (on-chain)</span>
                </div>
                <p className="font-mono text-xs text-gray-700 break-all bg-white p-2 border border-gray-200 rounded mb-2">
                  {doc.document_hash_value || 'Pending Validation...'}
                </p>
                
                <div className="flex items-center gap-2 mb-1 mt-3">
                  <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
                  <span className="text-xs text-gray-600">Blockchain TX ID</span>
                </div>
                <p className="font-mono text-xs text-gray-700 break-all bg-white p-2 border border-gray-200 rounded">
                  {doc.blockchain_tx_id || 'Pending / Old Record'}
                </p>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => handleView(doc)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
                <button 
                  onClick={() => handleDownload(doc)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {!isLoading && filteredDocuments.length === 0 && (
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
                  name="shipment_id"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Pilih Shipment</option>
                  {shipments.slice(0, 10).map(ship => (
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
                  name="document_type"
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
                  name="document_category"
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

      {/* PDF Viewer Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-400" />
                <h3 className="text-lg font-semibold">{viewingDoc.document_type} - {viewingDoc.document_id}.pdf</h3>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => handleDownload(viewingDoc)} className="text-gray-300 hover:text-white transition-colors">
                  <Download className="w-5 h-5" />
                </button>
                <button onClick={() => setViewingDoc(null)} className="text-gray-300 hover:text-white transition-colors">
                  <span className="text-2xl leading-none">&times;</span>
                </button>
              </div>
            </div>
            
            {/* The "PDF" Content */}
            <div className="flex-1 bg-gray-100 overflow-y-auto p-8 flex justify-center">
              {viewingDoc.file_data && viewingDoc.file_data.startsWith('data:application/pdf') ? (
                <div className="w-full h-full flex flex-col bg-white shadow-lg">
                  <iframe src={viewingDoc.file_data} className="w-full flex-1 border-0" title="PDF Document" />
                  {/* Footer / Blockchain Verification */}
                  <div className="p-6 border-t border-gray-300 bg-gray-50">
                    <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Database className="w-4 h-4 text-blue-600" />
                      Cryptographic Verification (Hyperledger Fabric)
                    </h4>
                    <div className="space-y-3 bg-blue-50/50 p-4 rounded border border-blue-100">
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Document Hash (SHA-256)</p>
                        <p className="font-mono text-xs text-blue-900 break-all">{viewingDoc.document_hash_value || "Menunggu proses hashing..."}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">On-Chain Transaction ID</p>
                        <p className="font-mono text-xs text-green-700 break-all">{viewingDoc.blockchain_tx_id || "Sinkronisasi ke node Fabric..."}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : viewingDoc.file_data && viewingDoc.file_data.startsWith('data:image/') ? (
                <div className="w-full h-full flex flex-col bg-white shadow-lg items-center">
                  <img src={viewingDoc.file_data} alt="Document" className="max-w-full max-h-[70vh] object-contain p-4" />
                  {/* Footer / Blockchain Verification */}
                  <div className="p-6 border-t border-gray-300 bg-gray-50 w-full mt-auto">
                    <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Database className="w-4 h-4 text-blue-600" />
                      Cryptographic Verification (Hyperledger Fabric)
                    </h4>
                    <div className="space-y-3 bg-blue-50/50 p-4 rounded border border-blue-100">
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Document Hash (SHA-256)</p>
                        <p className="font-mono text-xs text-blue-900 break-all">{viewingDoc.document_hash_value || "Menunggu proses hashing..."}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">On-Chain Transaction ID</p>
                        <p className="font-mono text-xs text-green-700 break-all">{viewingDoc.blockchain_tx_id || "Sinkronisasi ke node Fabric..."}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
              <div className="bg-white w-[210mm] min-h-[297mm] shadow-lg p-12 relative flex flex-col">
                {/* Watermark / Seal */}
                <div className="absolute top-12 right-12 w-32 h-32 border-4 border-blue-100 rounded-full flex items-center justify-center opacity-80 rotate-12">
                  <div className="text-center text-blue-800 font-bold text-sm tracking-widest uppercase">
                    Secured by<br/>Blockchain<br/>Network
                  </div>
                </div>

                {/* Header */}
                <div className="border-b-2 border-gray-800 pb-6 mb-8">
                  <h1 className="text-4xl font-serif font-bold text-gray-900 tracking-tight uppercase">{viewingDoc.document_type}</h1>
                  <p className="text-gray-500 mt-2 font-mono text-sm tracking-widest">{viewingDoc.document_id}</p>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-2 gap-x-12 gap-y-8 flex-1">
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Title/Description</h4>
                    <p className="text-lg font-medium text-gray-900">{viewingDoc.document_title}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Date Issued</h4>
                    <p className="text-lg font-medium text-gray-900">{new Date(viewingDoc.issued_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Category</h4>
                    <p className="text-lg font-medium text-gray-900">{viewingDoc.document_category}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Document Status</h4>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 border border-green-200">
                      {viewingDoc.document_status}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Shipment Reference</h4>
                    <p className="text-lg font-medium text-gray-900 font-mono bg-gray-50 p-3 rounded border border-gray-200">{viewingDoc.shipment_id}</p>
                  </div>
                </div>

                {/* Footer / Blockchain Verification */}
                <div className="mt-auto pt-8 border-t border-gray-300">
                  <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-600" />
                    Cryptographic Verification (Hyperledger Fabric)
                  </h4>
                  <div className="space-y-3 bg-blue-50/50 p-4 rounded border border-blue-100">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Document Hash (SHA-256)</p>
                      <p className="font-mono text-xs text-blue-900 break-all">{viewingDoc.document_hash_value || "Menunggu proses hashing..."}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">On-Chain Transaction ID</p>
                      <p className="font-mono text-xs text-green-700 break-all">{viewingDoc.blockchain_tx_id || "Sinkronisasi ke node Fabric..."}</p>
                    </div>
                  </div>
                </div>
              </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
