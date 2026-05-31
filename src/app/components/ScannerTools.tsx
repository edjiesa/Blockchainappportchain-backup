import { useState } from 'react';
import { ScanLine, QrCode, UploadCloud, CheckCircle } from 'lucide-react';

export function ScannerTools() {
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success'>('idle');

  const handleScan = () => {
    setScanStatus('scanning');
    setTimeout(() => {
      setScanStatus('success');
    }, 2500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Scanner Tools</h2>
          <p className="text-gray-600 mt-1">Pindai Dokumen dan Kontainer secara Instan</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* QR Code Scanner */}
        <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm text-center">
          <div className="mx-auto w-32 h-32 bg-gray-100 rounded-2xl flex items-center justify-center mb-6 relative overflow-hidden">
             {scanStatus === 'scanning' && <div className="absolute inset-0 bg-blue-500/20 border-t-2 border-blue-500 animate-[scan_2s_ease-in-out_infinite]" />}
             <QrCode className="w-16 h-16 text-gray-700" />
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2">QR Code / Barcode</h3>
          <p className="text-gray-600 mb-6">Pindai label kontainer atau e-BL token.</p>
          
          <button 
            onClick={handleScan}
            disabled={scanStatus !== 'idle'}
            className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <ScanLine className="w-5 h-5" />
            {scanStatus === 'idle' ? 'Mulai Kamera' : scanStatus === 'scanning' ? 'Memindai...' : 'Berhasil!'}
          </button>
        </div>

        {/* OCR Scanner */}
        <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm text-center">
          <div className="mx-auto w-32 h-32 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center mb-6">
             <UploadCloud className="w-12 h-12 text-gray-400" />
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2">OCR Document Scan</h3>
          <p className="text-gray-600 mb-6">Ekstrak teks dari dokumen fisik otomatis.</p>
          
          <button className="flex items-center justify-center gap-2 w-full py-3 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors">
            Pilih File Gambar
          </button>
        </div>
      </div>
      
      {scanStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-start gap-4">
          <CheckCircle className="w-8 h-8 text-green-600 shrink-0" />
          <div>
            <h4 className="text-lg font-bold text-green-900">Scan Berhasil: CNT-881923</h4>
            <p className="text-green-800 mt-1">Data kontainer telah divalidasi dengan Hyperledger Fabric. Tidak ada manipulasi yang terdeteksi.</p>
            <button onClick={() => setScanStatus('idle')} className="mt-3 text-sm text-green-700 font-semibold hover:underline">
              Pindai Ulang
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
