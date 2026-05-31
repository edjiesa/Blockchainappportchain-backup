import { useState } from 'react';
import { Usb, ShieldCheck, Bluetooth, Lock } from 'lucide-react';

export function HardwareWallet() {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  const connectWallet = () => {
    setStatus('connecting');
    setTimeout(() => {
      setStatus('connected');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Hardware Wallet</h2>
          <p className="text-gray-600 mt-1">Otorisasi Private Key via WebUSB / Bluetooth</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm text-center">
        <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-colors duration-500 ${status === 'connected' ? 'bg-green-100 text-green-600' : status === 'connecting' ? 'bg-blue-100 text-blue-600 animate-pulse' : 'bg-gray-100 text-gray-400'}`}>
          {status === 'connected' ? <ShieldCheck className="w-12 h-12" /> : <Lock className="w-12 h-12" />}
        </div>
        
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {status === 'connected' ? 'Wallet Terhubung' : status === 'connecting' ? 'Menghubungkan...' : 'Wallet Belum Terhubung'}
        </h3>
        
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          {status === 'connected' 
            ? 'Hardware wallet Anda siap digunakan untuk menandatangani transaksi blockchain.' 
            : 'Silakan hubungkan perangkat Hardware Wallet (seperti Ledger atau Trezor) untuk keamanan maksimal.'}
        </p>

        {status === 'disconnected' && (
          <div className="flex justify-center gap-4">
            <button onClick={connectWallet} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Usb className="w-5 h-5" />
              Hubungkan via WebUSB
            </button>
            <button onClick={connectWallet} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <Bluetooth className="w-5 h-5" />
              Hubungkan via Bluetooth
            </button>
          </div>
        )}

        {status === 'connected' && (
          <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200 text-green-800 flex items-center gap-3 max-w-md mx-auto">
            <ShieldCheck className="w-6 h-6 text-green-600" />
            <div className="text-left">
              <p className="font-bold">AES-256 Enabled</p>
              <p className="text-sm opacity-90">Kunci privat aman di dalam perangkat.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
