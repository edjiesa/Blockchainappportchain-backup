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
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-[40vh] bg-gradient-to-b from-blue-900 to-blue-950 -z-10">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <header className="px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner">
            <Anchor className="w-6 h-6 text-blue-300" />
          </div>
          <div>
            <h1 className="font-bold text-2xl tracking-tight text-white">PortChain</h1>
            <p className="text-[10px] uppercase tracking-widest text-blue-300 font-semibold">Public Tracking</p>
          </div>
        </div>
        <Link to="/login" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/10 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12 z-10">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-white mb-4 tracking-tight shadow-sm">Track Your Shipment</h2>
          <p className="text-blue-100 text-lg">Enter your e-BL Token Number or Shipment Code to track its journey.</p>
        </div>

        {/* Search Box */}
        <div className="bg-white p-2 rounded-2xl shadow-xl shadow-blue-900/10 border border-gray-100 mb-12">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="flex-1 relative">
              <PackageSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
              <input
                type="text"
                placeholder="e.g. EBL-49e3e43b or SHP-..."
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="w-full bg-transparent pl-12 pr-4 py-4 text-gray-900 text-lg focus:outline-none placeholder:text-gray-400 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || !trackingNumber.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-2"
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
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 mb-8 animate-in fade-in slide-in-from-top-4">
            <Shield className="w-5 h-5 text-red-500" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Timeline Results */}
        {timeline && (
          <div className="bg-white rounded-3xl p-8 shadow-xl shadow-blue-900/5 border border-gray-100 animate-in fade-in slide-in-from-bottom-8">
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Tracking Result</p>
                <h3 className="text-2xl font-bold text-gray-900 font-mono">{shipmentCode}</h3>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center border border-green-100">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
            </div>

            <div className="relative pl-6">
              {/* Vertical line connecting nodes */}
              <div className="absolute left-[39px] top-4 bottom-4 w-0.5 bg-gray-200"></div>

              <div className="space-y-8 relative">
                {timeline.map((event, index) => {
                  const Icon = IconMap[event.icon] || Activity;
                  const isLast = index === timeline.length - 1;
                  
                  let iconColor = "text-gray-400";
                  let bgColor = "bg-gray-100 border-gray-200";
                  
                  if (event.status === 'completed') {
                    iconColor = "text-blue-600";
                    bgColor = "bg-white border-blue-500 ring-4 ring-blue-50";
                  } else if (event.status === 'failed') {
                    iconColor = "text-red-600";
                    bgColor = "bg-white border-red-500 ring-4 ring-red-50";
                  }

                  return (
                    <div key={index} className="flex gap-6 relative group">
                      {/* Timeline Node */}
                      <div className="relative z-10 flex-shrink-0 mt-1">
                        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 ${bgColor}`}>
                          <Icon className={`w-5 h-5 ${iconColor}`} />
                        </div>
                      </div>

                      {/* Content */}
                      <div className={`flex-1 ${!isLast ? 'pb-8 border-b border-gray-50' : ''}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-1 sm:gap-4">
                          <h4 className="text-lg font-bold text-gray-900">{event.title}</h4>
                          <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md">
                            {new Date(event.date).toLocaleString('id-ID')}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">{event.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="py-6 text-center text-gray-500 text-sm">
        <p>&copy; 2026 PortChain Global Logistics. Secured by Hyperledger Fabric.</p>
      </footer>
    </div>
  );
}
