import { useState, useEffect } from 'react';
import { Search, FileCheck, User, Clock, Database, CheckCircle, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function AuditTrail() {
  const [searchTerm, setSearchTerm] = useState('');
  const [syncFilter, setSyncFilter] = useState<string>('all');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/rpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'GetAuditLogs', params: {}, id: Date.now() })
      });
      const data = await res.json();
      if (data.result) {
        // Map from blockchain_transactions to UI format
        const formatted = data.result.map((log: any) => ({
          blockchain_tx_id: log.blockchain_tx_id,
          transaction_type: log.transaction_type,
          channel_name: log.channel_name,
          chaincode_name: log.chaincode_name,
          validation_status: log.validation_status === 'VALID' ? 'synced' : 'pending',
          created_at: log.created_at,
          executor: log.executor,
          block_number: log.block_number
        }));
        setAuditLogs(formatted);
      }
    } catch (err) {
      console.error("Failed to fetch audit logs", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.transaction_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.channel_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.blockchain_tx_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSync = syncFilter === 'all' || log.validation_status === syncFilter;

    return matchesSearch && matchesSync;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Audit Trail</h2>
        <p className="text-gray-600 mt-1">Log aktivitas sistem dengan sinkronisasi blockchain</p>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-xl p-6 text-white">
        <div className="flex items-center gap-4">
          <FileCheck className="w-12 h-12" />
          <div className="flex-1">
            <h3 className="text-xl font-bold">Blockchain Audit Trail</h3>
            <p className="text-indigo-100 mt-1">
              Setiap aktivitas dicatat di PostgreSQL dan disinkronkan ke Hyperledger Fabric untuk memastikan immutability
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan aksi, user, atau entity ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Status Sinkronisasi:</span>
          <select
            value={syncFilter}
            onChange={(e) => setSyncFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua</option>
            <option value="synced">Synced</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <FileCheck className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Total Logs</p>
              <p className="text-2xl font-bold text-gray-900">{auditLogs.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Synced</p>
              <p className="text-2xl font-bold text-green-600">
                {auditLogs.filter(l => l.validation_status === 'synced').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {auditLogs.filter(l => l.validation_status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Active Chaincodes</p>
              <p className="text-2xl font-bold text-blue-600">
                {new Set(auditLogs.map(l => l.chaincode_name)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Logs Timeline */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Activity Timeline</h3>
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Loading audit logs...</div>
          ) : filteredLogs.map((log) => {
            return (
              <div key={log.blockchain_tx_id} className="relative pl-8 pb-4 border-l-2 border-gray-200 last:border-l-0">
                <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-blue-600 border-2 border-white"></div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-center px-1">
                        <span className="text-white text-xs font-bold leading-tight">
                          {log.executor ? log.executor.substring(0, 3).toUpperCase() : 'SYS'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{log.transaction_type}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <User className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-600">
                            {log.executor || 'System'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                      log.validation_status === 'synced'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {log.validation_status === 'synced' ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      {log.validation_status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-sm">
                    <div>
                      <p className="text-gray-600 text-xs">Channel Name</p>
                      <p className="font-mono text-xs text-gray-900 mt-0.5">{log.channel_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs">Chaincode Name</p>
                      <p className="text-gray-900 mt-0.5">{log.chaincode_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs">Timestamp</p>
                      <p className="text-gray-900 mt-0.5">
                        {new Date(log.created_at).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="text-xs text-gray-600 break-all">
                        Blockchain TX: <span className="font-mono text-blue-600">{log.blockchain_tx_id}</span>
                      </span>
                    </div>
                    {log.block_number && (
                      <div className="flex items-center shrink-0">
                        <span className="text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-md shadow-sm">
                          Block #{log.block_number}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <FileCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Tidak ada audit log ditemukan</p>
          </div>
        )}
      </div>

      {/* Action Types Distribution */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Distribusi Jenis Aksi</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Array.from(new Set(auditLogs.map(l => l.transaction_type))).map(action => {
            const count = auditLogs.filter(l => l.transaction_type === action).length;
            return (
              <div key={action as string} className="text-center p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
                <p className="text-xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-600 mt-1">{action as string}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
