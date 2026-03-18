import { useState } from 'react';
import { Search, Database, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { mockBlockchainTransactions } from '../data/portData';

export function BlockchainExplorer() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const filteredTxs = mockBlockchainTransactions.filter(tx =>
    tx.tx_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.chaincode_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.function_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTxs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTxs = filteredTxs.slice(startIndex, startIndex + itemsPerPage);

  const chaincodes = ['portchain-cc', 'customs-cc', 'ebl-cc'];
  const functions = ['CreateShipment', 'UpdateCustomsStatus', 'TransferEBL', 'UploadDocument', 'CreateContainer'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Blockchain Explorer</h2>
        <p className="text-gray-600 mt-1">Jelajahi transaksi Hyperledger Fabric</p>
      </div>

      {/* Network Info */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-xl p-6 text-white">
        <div className="flex items-center gap-4">
          <Database className="w-12 h-12" />
          <div className="flex-1">
            <h3 className="text-xl font-bold">Hyperledger Fabric Ledger</h3>
            <p className="text-green-100 mt-1">Channel: port-channel • Consensus: Raft</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-green-100">Total Transactions</p>
            <p className="text-3xl font-bold">{mockBlockchainTransactions.length}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan TX ID, chaincode, atau function..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-600">Total Transactions</p>
          <p className="text-2xl font-bold text-gray-900">{mockBlockchainTransactions.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-600">Valid</p>
          <p className="text-2xl font-bold text-green-600">
            {mockBlockchainTransactions.filter(tx => tx.validation_status === 'VALID').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-600">Latest Block</p>
          <p className="text-2xl font-bold text-gray-900">
            #{Math.max(...mockBlockchainTransactions.map(tx => tx.block_number))}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-600">Chaincodes</p>
          <p className="text-2xl font-bold text-gray-900">{chaincodes.length}</p>
        </div>
      </div>

      {/* Chaincode Stats */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Chaincode Activity</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {chaincodes.map(cc => {
            const count = mockBlockchainTransactions.filter(tx => tx.chaincode_name === cc).length;
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

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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
              {paginatedTxs.map((tx) => (
                <tr key={tx.blockchain_tx_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-blue-600" />
                      <span className="font-mono text-sm text-gray-900">
                        {tx.tx_id.substring(0, 16)}...
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono font-medium text-gray-900">
                      #{tx.block_number}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      tx.chaincode_name === 'portchain-cc' ? 'bg-blue-100 text-blue-800' :
                      tx.chaincode_name === 'customs-cc' ? 'bg-purple-100 text-purple-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {tx.chaincode_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {tx.function_name}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-gray-600">{tx.channel_name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {tx.validation_status === 'VALID' ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-600">VALID</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-medium text-red-600">INVALID</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                    {new Date(tx.timestamp).toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Menampilkan {startIndex + 1} sampai {Math.min(startIndex + itemsPerPage, filteredTxs.length)} dari {filteredTxs.length} transaksi
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

      {/* Function Distribution */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Function Calls Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {functions.map(func => {
            const count = mockBlockchainTransactions.filter(tx => tx.function_name === func).length;
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
