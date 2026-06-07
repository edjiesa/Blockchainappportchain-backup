import { useState } from 'react';
import { Link } from 'react-router';
import { 
  Search, 
  Anchor, 
  FileText, 
  Shield, 
  Receipt, 
  ArrowRightLeft, 
  CheckCircle,
  Activity,
  ArrowLeft,
  PackageSearch
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

type TimelineEvent = {
  date: string;
  title: string;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  icon: string;
};

const IconMap: Record<string, any> = {
  'Anchor': Anchor,
  'FileText': FileText,
  'Shield': Shield,
  'Receipt': Receipt,
  'ArrowRightLeft': ArrowRightLeft,
  'CheckCircle': CheckCircle,
};

export function PublicTracking() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [timeline, setTimeline] = useState<TimelineEvent[] | null>(null);
  const [shipmentCode, setShipmentCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;

    setIsSearching(true);
    setError(null);
    setTimeline(null);

    try {
      const response = await fetch(`${API_URL}/rpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'TrackShipment',
          params: { tracking_number: trackingNumber },
          id: Date.now(),
        }),
      });

      const data = await response.json();
      if (data.error) {
        setError(data.error.message || 'Tracking number not found');
      } else if (data.result && data.result.success) {
        setTimeline(data.result.timeline);
        setShipmentCode(data.result.shipment_code);
      } else {
        setError('Tracking number not found');
      }
    } catch (err) {
      setError('Connection error. Please try again later.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans relative overflow-x-hidden bg-gray-900">
      {/* Full-screen Background */}
      <div className="fixed inset-0 w-full h-full -z-10">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1494412574643-05f45f516d27?q=80&w=2940&auto=format&fit=crop')] bg-cover bg-center bg-no-repeat bg-fixed"></div>
        {/* Overlay gradient for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/90 via-blue-900/70 to-slate-900/90 backdrop-blur-[2px]"></div>
      </div>

      <header className="px-6 py-6 flex items-center justify-between z-10 w-full max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            <Anchor className="w-6 h-6 text-blue-200" />
          </div>
          <div>
            <h1 className="font-bold text-2xl tracking-tight text-white drop-shadow-md">PortChain</h1>
            <p className="text-[10px] uppercase tracking-widest text-blue-300 font-semibold drop-shadow-md">Public Tracking</p>
          </div>
        </div>
        <Link to="/login" className="flex items-center gap-2 text-white/90 hover:text-white transition-all bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg backdrop-blur-md border border-white/20 shadow-lg text-sm font-medium hover:scale-105">
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-8 z-10 flex flex-col items-center">
        <div className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight drop-shadow-lg">Track Your Shipment</h2>
          <p className="text-blue-100/90 text-lg md:text-xl font-medium max-w-2xl mx-auto drop-shadow-md">Enter your e-BL Token Number or Shipment Code to track its journey across the supply chain.</p>
        </div>

        {/* Search Box */}
        <div className="w-full bg-white/10 backdrop-blur-xl p-3 rounded-3xl shadow-2xl border border-white/20 mb-12 transform hover:scale-[1.01] transition-all">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 relative w-full">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                <PackageSearch className="w-5 h-5 text-blue-100" />
              </div>
              <input
                type="text"
                placeholder="e.g. EBL-49e3e43b or SHP-123"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="w-full bg-white/5 backdrop-blur-sm pl-16 pr-4 py-4 rounded-2xl text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-blue-200/50 font-mono border border-white/10 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || !trackingNumber.trim()}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-blue-800 disabled:to-blue-800 disabled:opacity-70 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2 border border-blue-400/30"
            >
              {isSearching ? (
                <>
                  <Activity className="w-5 h-5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Track
                </>
              )}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="w-full bg-red-500/20 backdrop-blur-md border border-red-500/50 text-white p-5 rounded-2xl flex items-center gap-4 mb-8 animate-in fade-in slide-in-from-top-4 shadow-lg">
            <div className="w-10 h-10 bg-red-500/30 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-200" />
            </div>
            <p className="font-semibold text-lg">{error}</p>
          </div>
        )}

        {/* Timeline Results */}
        {timeline && (
          <div className="w-full bg-white/95 backdrop-blur-2xl rounded-3xl p-8 md:p-10 shadow-2xl border border-white/40 animate-in fade-in slide-in-from-bottom-8 relative overflow-hidden">
            
            {/* Decorative watermark inside the card */}
            <div className="absolute top-10 right-10 opacity-[0.03] pointer-events-none">
              <Anchor className="w-64 h-64" />
            </div>

            <div className="flex items-center justify-between mb-10 pb-6 border-b border-gray-200/60 relative z-10">
              <div>
                <p className="text-sm font-extrabold text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Tracking Result
                </p>
                <h3 className="text-3xl font-bold text-gray-900 font-mono bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">{shipmentCode}</h3>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30 transform rotate-3">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
            </div>

            <div className="relative pl-8 md:pl-10 z-10">
              {/* Vertical line connecting nodes */}
              <div className="absolute left-[47px] md:left-[55px] top-6 bottom-6 w-1 bg-gradient-to-b from-blue-500 via-blue-300 to-gray-200 rounded-full"></div>

              <div className="space-y-10 relative">
                {timeline.map((event, index) => {
                  const Icon = IconMap[event.icon] || Activity;
                  const isLast = index === timeline.length - 1;
                  
                  let iconColor = "text-gray-400";
                  let bgColor = "bg-gray-100 border-gray-200 shadow-inner";
                  
                  if (event.status === 'completed') {
                    iconColor = "text-white";
                    bgColor = "bg-gradient-to-br from-blue-500 to-blue-700 border-blue-400 shadow-lg shadow-blue-500/40 ring-4 ring-blue-50";
                  } else if (event.status === 'failed') {
                    iconColor = "text-white";
                    bgColor = "bg-gradient-to-br from-red-500 to-red-700 border-red-400 shadow-lg shadow-red-500/40 ring-4 ring-red-50";
                  }

                  return (
                    <div key={index} className="flex gap-8 relative group">
                      {/* Timeline Node */}
                      <div className="relative z-10 flex-shrink-0 mt-0.5">
                        <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl border flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3 ${bgColor}`}>
                          <Icon className={`w-5 h-5 md:w-6 md:h-6 ${iconColor}`} />
                        </div>
                      </div>

                      {/* Content */}
                      <div className={`flex-1 ${!isLast ? 'pb-10 border-b border-gray-100' : ''}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2 sm:gap-4">
                          <h4 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{event.title}</h4>
                          <span className="text-xs font-bold text-blue-800 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg shadow-sm w-fit">
                            {new Date(event.date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        </div>
                        <p className="text-gray-600 text-base leading-relaxed max-w-xl">{event.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="py-8 mt-auto z-10 border-t border-white/10 bg-black/20 backdrop-blur-lg">
        <p className="text-center text-white/60 text-sm font-medium">
          &copy; {new Date().getFullYear()} PortChain Global Logistics. Secured by Hyperledger Fabric.
        </p>
      </footer>
    </div>
  );
}
