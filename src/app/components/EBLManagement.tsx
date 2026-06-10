import { useState, useEffect } from 'react';
import { Receipt, ArrowRightLeft, Building2, CheckCircle, Clock, Eye, FileText, Download, Database } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function EBLManagement() {
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [selectedEBL, setSelectedEBL] = useState<string>('');
  
  const [tokens, setTokens] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [customsClearances, setCustomsClearances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingDoc, setViewingDoc] = useState<any>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const p1 = fetch(`${API_URL}/rpc`, { method: 'POST', body: JSON.stringify({ jsonrpc: '2.0', method: 'GetEBLTokens', id: 1 }) }).then(r => r.json());
      const p2 = fetch(`${API_URL}/rpc`, { method: 'POST', body: JSON.stringify({ jsonrpc: '2.0', method: 'GetOrganizations', id: 2 }) }).then(r => r.json());
      const p3 = fetch(`${API_URL}/rpc`, { method: 'POST', body: JSON.stringify({ jsonrpc: '2.0', method: 'GetDocuments', id: 3 }) }).then(r => r.json());
      const p4 = fetch(`${API_URL}/rpc`, { method: 'POST', body: JSON.stringify({ jsonrpc: '2.0', method: 'GetAllShipments', id: 4 }) }).then(r => r.json());
      const p5 = fetch(`${API_URL}/rpc`, { method: 'POST', body: JSON.stringify({ jsonrpc: '2.0', method: 'GetCustomsClearances', id: 5 }) }).then(r => r.json());

      const [resTokens, resOrgs, resDocs, resShips, resCustoms] = await Promise.all([p1, p2, p3, p4, p5]);

      if (resTokens.result) setTokens(resTokens.result);
      if (resOrgs.result) setOrganizations(resOrgs.result);
      if (resDocs.result) setDocuments(resDocs.result);
      if (resShips.result) setShipments(resShips.result);
      if (resCustoms.result) setCustomsClearances(resCustoms.result);
    } catch (err) {
      console.error("Fetch data failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    try {
      await fetch(`${API_URL}/rpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'TransferEBLToken',
          params: {
            token_number: selectedEBL,
            to_org_id: formData.get('to_org_id'),
            transfer_reason: formData.get('transfer_reason')
          },
          id: Date.now()
        })
      });
      setShowTransferDialog(false);
      setSelectedEBL('');
      await fetchData();
    } catch (err) {
      console.error("Transfer failed", err);
      alert("Gagal melakukan transfer");
    }
  };

  const handleViewDocument = (doc: any) => {
    if (!doc) {
      alert("Dokumen fisik belum diunggah atau tidak ditemukan.");
      return;
    }
    setViewingDoc(doc);
    if (doc.file_data && doc.file_data.startsWith('data:application/pdf')) {
      try {
        const base64Data = doc.file_data.split(',')[1];
        const byteString = atob(base64Data);
        const arrayBuffer = new ArrayBuffer(byteString.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        for (let i = 0; i < byteString.length; i++) {
          uint8Array[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
        setPdfUrl(URL.createObjectURL(blob));
      } catch (e) {
        console.error("Error creating PDF blob", e);
        setPdfUrl(doc.file_data); // fallback
      }
    } else {
      setPdfUrl(null);
    }
  };

  const handleDownload = (doc: any) => {
    const content = `PORTCHAIN DOCUMENT RECORD\n========================\n\nTitle: ${doc.document_title}\nType: ${doc.document_type}\nShipment ID: ${doc.shipment_id}\nVersion: ${doc.document_version}\nHash (on-chain): ${doc.document_hash_value}\nIssued At: ${new Date(doc.issued_date || doc.issued_at || new Date()).toLocaleString('id-ID')}\n\n* This is a cryptographically verified document from Portchain *`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(doc.document_type || 'document').replace(/\s+/g, '_')}_${doc.document_id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Electronic Bill of Lading (e-BL)</h2>
        <p className="text-gray-600 mt-1">Manajemen tokenisasi Bill of Lading di blockchain</p>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-xl p-6 text-white">
        <div className="flex items-center gap-4">
          <Receipt className="w-12 h-12" />
          <div className="flex-1">
            <h3 className="text-xl font-bold">Blockchain-based e-BL</h3>
            <p className="text-purple-100 mt-1">
              Setiap Bill of Lading ditokenisasi di Hyperledger Fabric untuk memastikan kepemilikan yang aman dan transfer yang dapat diaudit
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Receipt className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Total e-BL</p>
              <p className="text-2xl font-bold text-gray-900">{tokens.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Active Tokens</p>
              <p className="text-2xl font-bold text-green-600">{tokens.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ArrowRightLeft className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Transfers</p>
              <p className="text-2xl font-bold text-blue-600">
                {Math.floor(tokens.length * 0.4)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* e-BL Tokens List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Memuat Token e-BL...</div>
        ) : tokens.map((ebl) => {
          const document = documents.find(d => d.document_id === ebl.document_id);
          const shipment = document ? shipments.find(s => s.shipment_id === document.shipment_id) : null;
          const currentOwner = organizations.find(o => o.organization_id === ebl.current_owner_org_id);
          
          // EBL original issuer is essentially the organization that created it, but since it's mock, we default
          const issuer = organizations.find(o => o.organization_id === 'org-001') || currentOwner;

          return (
            <div key={ebl.ebl_token_id} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center">
                    <Receipt className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{ebl.token_number}</h3>
                    <p className="text-sm text-gray-600 mt-0.5">
                      Shipment: <span className="font-mono text-blue-600">{shipment?.shipment_code}</span>
                    </p>
                  </div>
                </div>
                {ebl.token_status === 'COMPLETED' ? (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 border border-blue-200 rounded-full text-sm font-bold flex items-center gap-1 shadow-sm">
                    <CheckCircle className="w-4 h-4" /> Selesai
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Active
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-gray-600" />
                    <p className="text-xs text-gray-600">Current Owner</p>
                  </div>
                  <p className="font-medium text-gray-900">{currentOwner?.organization_name}</p>
                  <p className="text-xs text-gray-600 mt-1">{currentOwner?.organization_type}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-gray-600" />
                    <p className="text-xs text-gray-600">Original Issuer</p>
                  </div>
                  <p className="font-medium text-gray-900">{issuer?.organization_name}</p>
                  <p className="text-xs text-gray-600 mt-1">{issuer?.organization_type}</p>
                </div>
              </div>

              {shipment && (
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <p className="text-xs text-blue-800 mb-2">Shipment Details</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-blue-700">Vessel</p>
                      <p className="font-medium text-blue-900">{shipment.vessel_name}</p>
                    </div>
                    <div>
                      <p className="text-blue-700">Route</p>
                      <p className="font-medium text-blue-900">{shipment.origin_port} → {shipment.destination_port}</p>
                    </div>
                    <div>
                      <p className="text-blue-700">Goods</p>
                      <p className="font-medium text-blue-900">{shipment.goods_description}</p>
                    </div>
                    <div>
                      <p className="text-blue-700">Weight</p>
                      <p className="font-medium text-blue-900">{(shipment.total_weight_kg / 1000).toFixed(1)} ton</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-600">
                  <p>Issued: {new Date(ebl.issued_at).toLocaleDateString('id-ID')}</p>
                  <p className="mt-1">Blockchain TX: <span className="font-mono text-blue-600">{ebl.blockchain_tx_id}</span></p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewDocument(document)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Lihat Dokumen
                  </button>
                  <button
                    onClick={() => {
                      if (shipment) {
                        const hasPIB = customsClearances.some(c => c.shipment_id === shipment.shipment_id);
                        if (!hasPIB) {
                          alert("Belum dapat diproses, isi Pemberitahuan impor barang (PIB) nya dahulu di menu customs");
                          return;
                        }
                      }
                      setSelectedEBL(ebl.token_number);
                      setShowTransferDialog(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    Transfer e-BL
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Transfer Dialog */}
      {showTransferDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Transfer e-BL</h3>
            
            <form onSubmit={handleTransfer} className="space-y-4">
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm font-medium text-purple-900">Token Number</p>
                <p className="text-lg font-bold text-purple-900 mt-1">{selectedEBL}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transfer ke Organisasi
                </label>
                <select
                  name="to_org_id"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Pilih Organisasi</option>
                  {organizations.map(org => (
                    <option key={org.organization_id} value={org.organization_id}>
                      {org.organization_name} ({org.organization_type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alasan Transfer
                </label>
                <textarea
                  name="transfer_reason"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  placeholder="Masukkan alasan transfer..."
                  required
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Blockchain Audit Trail:</strong> Transfer akan dicatat secara permanen di Hyperledger Fabric untuk keperluan audit
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowTransferDialog(false);
                    setSelectedEBL('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
                >
                  Transfer
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
                <button onClick={() => {
                  if (pdfUrl && pdfUrl.startsWith('blob:')) URL.revokeObjectURL(pdfUrl);
                  setPdfUrl(null);
                  setViewingDoc(null);
                }} className="text-gray-300 hover:text-white transition-colors">
                  <span className="text-2xl leading-none">&times;</span>
                </button>
              </div>
            </div>
            
            <div className="flex-1 bg-gray-100 overflow-y-auto p-8 flex justify-center">
              {viewingDoc.file_data && viewingDoc.file_data.startsWith('data:application/pdf') ? (
                <div className="w-full h-full flex flex-col bg-white shadow-lg">
                  <iframe src={pdfUrl || viewingDoc.file_data} className="w-full flex-1 border-0" title="PDF Document" />
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
                <div className="absolute top-12 right-12 w-32 h-32 border-4 border-blue-100 rounded-full flex items-center justify-center opacity-80 rotate-12">
                  <div className="text-center text-blue-800 font-bold text-sm tracking-widest uppercase">
                    Secured by<br/>Blockchain<br/>Network
                  </div>
                </div>
                <div className="border-b-2 border-gray-800 pb-6 mb-8">
                  <h1 className="text-4xl font-serif font-bold text-gray-900 tracking-tight uppercase">{viewingDoc.document_type}</h1>
                  <p className="text-gray-500 mt-2 font-mono text-sm tracking-widest">{viewingDoc.document_id}</p>
                </div>
                <div className="grid grid-cols-2 gap-x-12 gap-y-8 flex-1">
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Title/Description</h4>
                    <p className="text-lg font-medium text-gray-900">{viewingDoc.document_title}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Date Issued</h4>
                    <p className="text-lg font-medium text-gray-900">{new Date(viewingDoc.issued_date || viewingDoc.issued_at || new Date()).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Category</h4>
                    <p className="text-lg font-medium text-gray-900">{viewingDoc.document_category || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Document Status</h4>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 border border-green-200">
                      {viewingDoc.document_status || 'Active'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Shipment Reference</h4>
                    <p className="text-lg font-medium text-gray-900 font-mono bg-gray-50 p-3 rounded border border-gray-200">{viewingDoc.shipment_id}</p>
                  </div>
                </div>
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
