import { useState, useEffect, useCallback } from 'react';
import { Search, Database, CheckCircle, XCircle, ChevronLeft, ChevronRight, Activity, RefreshCw, Wifi, WifiOff } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface NetworkStatus {
  fabric: string;
  database: string;
  message: string;
}

export function BlockchainExplorer() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isConnected, setIsConnected] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  
  // Real data states
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total_transactions: 0, valid_transactions: 0, latest_block: 0, chaincodes: [] });
  const [isLoading, setIsLoading] = useState(true);

  const itemsPerPage = 15;

  const filteredTxs = transactions.filter(tx =>
    (tx.tx_id && tx.tx_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (tx.chaincode_name && tx.chaincode_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (tx.function_name && tx.function_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredTxs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTxs = filteredTxs.slice(startIndex, startIndex + itemsPerPage);
  const chaincodes = ['portchain-cc', 'customs-cc', 'ebl-cc'];
  const functions = ['CreateShipment', 'UpdateCustomsStatus', 'TransferEBLToken', 'UploadDocument', 'CreateContainer'];

  const checkStatus = useCallback(async () => {
    setIsChecking(true);
    try {
      const [statusRes, txRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/status`),
        fetch(`${API_URL}/api/explorer/transactions`),
        fetch(`${API_URL}/api/explorer/stats`)
      ]);
      
      const statusData = await statusRes.json();
      setIsConnected(statusData.success);
      setNetworkStatus(statusData);

      if (txRes.ok) {
         const txData = await txRes.json();
         if (txData.success && txData.data) {
             setTransactions(txData.data);
         }
      }
      
      if (statsRes.ok) {
         const statsData = await statsRes.json();
         if (statsData.success && statsData.data) {
             setStats(statsData.data);
         }
      }

    } catch {
      setIsConnected(false);
      setNetworkStatus({ fabric: 'offline', database: 'offline', message: 'Backend API tidak dapat dijangkau' });
    } finally {
      setIsChecking(false);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 8000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Blockchain Explorer</h2>
          <p className="text-gray-600 mt-1">Jelajahi transaksi Hyperledger Fabric</p>
        </div>
        <button
          onClick={checkStatus}
          disabled={isChecking}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Network Status Banner */}
      <div className={`rounded-xl p-6 text-white ${isConnected ? 'bg-gradient-to-r from-green-600 to-green-800' : 'bg-gradient-to-r from-orange-600 to-red-700'}`}>
        <div className="flex items-center gap-4">
          <Database className={`w-12 h-12 ${isConnected ? 'animate-pulse' : ''}`} />
          <div className="flex-1">
            <h3 className="text-xl font-bold">Hyperledger Fabric Ledger</h3>
            <div className="flex items-center gap-2 mt-1">
              <Activity className="w-4 h-4" />
              <span className="text-sm opacity-90">
                {networkStatus?.message || 'Memeriksa koneksi...'}
              </span>
            </div>
          </div>
          <div className="text-right space-y-2">
            <div className="flex items-center gap-2 justify-end">
              {networkStatus?.fabric === 'connected'
                ? <Wifi className="w-4 h-4" />
                : <WifiOff className="w-4 h-4 opacity-70" />}
              <span className="text-sm">Fabric: <strong>{networkStatus?.fabric || '...'}</strong></span>
            </div>
            <div className="flex items-center gap-2 justify-end">
              {networkStatus?.database === 'connected'
                ? <CheckCircle className="w-4 h-4" />
                : <XCircle className="w-4 h-4 opacity-70" />}
              <span className="text-sm">Database: <strong>{networkStatus?.database || '...'}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-600">Total Transactions</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total_transactions}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-600">Valid</p>
          <p className="text-2xl font-bold text-green-600">
            {stats.valid_transactions}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-600">Latest Block</p>
          <p className="text-2xl font-bold text-gray-900">
            #{stats.latest_block}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-600">Chaincodes</p>
          <p className="text-2xl font-bold text-gray-900">{chaincodes.length}</p>
        </div>
      </div>

      {/* Chaincode Activity */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Chaincode Activity</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {chaincodes.map(cc => {
            const count = transactions.filter(tx => tx.chaincode_name === cc).length;
            return (
              <div key={cc} className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                <p className="text-sm text-blue-800 font-medium">{cc}</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">{count}</p>
                <p className="text-xs text-blue-700 mt-1">transactions</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan TX ID, chaincode, atau function..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase">TX ID</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase">Block</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase">Chaincode</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase">Function</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase">Channel</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
                    Mengambil data transaksi dari Ledger Fabric...
                  </td>
                </tr>
              ) : paginatedTxs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Tidak ada transaksi yang ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedTxs.map((tx, idx) => (
                  <tr key={tx.tx_id || idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-blue-600" />
                        <span className="font-mono text-sm text-gray-900">{tx.tx_id ? tx.tx_id.substring(0, 16) : 'N/A'}...</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-gray-900">#{tx.block_number}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        tx.chaincode_name === 'portchain-cc' ? 'bg-blue-100 text-blue-800' :
                        tx.chaincode_name === 'customs-cc' ? 'bg-purple-100 text-purple-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {tx.chaincode_name || 'unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{tx.function_name || 'unknown'}</td>
                    <td className="px-6 py-4 font-mono text-sm text-gray-600">{tx.channel_name || 'mychannel'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {tx.validation_status === 'VALID' ? (
                          <><CheckCircle className="w-4 h-4 text-green-600" /><span className="text-sm font-medium text-green-600">VALID</span></>
                        ) : (
                          <><XCircle className="w-4 h-4 text-red-600" /><span className="text-sm font-medium text-red-600">INVALID</span></>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {tx.created_at ? new Date(tx.created_at).toLocaleString('id-ID') : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Menampilkan {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredTxs.length)} dari {filteredTxs.length}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-600">Hal {currentPage} / {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Function Distribution */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Function Calls Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {functions.map(func => {
            const count = transactions.filter(tx => tx.function_name === func).length;
            return (
              <div key={func} className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-600 mt-1">{func}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
