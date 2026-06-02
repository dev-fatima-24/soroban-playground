'use client';

import { useState, useEffect } from 'react';
import { Search, Download, Filter, ExternalLink, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ContractInteraction {
  id: string;
  timestamp: string;
  contractName: string;
  contractAddress?: string;
  functionName: string;
  parameters?: any;
  result?: any;
  status: 'pending' | 'success' | 'failed' | 'reverted';
  transactionHash?: string;
  blockNumber?: string;
  gasUsed?: string;
  executionTime?: number;
  errorMessage?: string;
  errorDetails?: any;
  network: string;
}

interface InteractionStats {
  total: number;
  successful: number;
  failed: number;
  pending: number;
  averageExecutionTime: number;
  totalGasUsed: string;
}

interface TransactionExplorerProps {
  studentId?: string;
  apiUrl?: string;
}

export function TransactionExplorer({ studentId, apiUrl = '/api' }: TransactionExplorerProps) {
  const [interactions, setInteractions] = useState<ContractInteraction[]>([]);
  const [stats, setStats] = useState<InteractionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [contractFilter, setContractFilter] = useState<string>('');
  const [selectedInteraction, setSelectedInteraction] = useState<ContractInteraction | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch interactions
  const fetchInteractions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (studentId) params.append('studentId', studentId);
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (contractFilter) params.append('contractName', contractFilter);

      const response = await fetch(`${apiUrl}/contract-interactions?${params}`);
      const data = await response.json();

      setInteractions(data.interactions || []);
      setTotalPages(data.pages || 1);
    } catch (error) {
      console.error('Failed to fetch interactions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      if (studentId) params.append('studentId', studentId);

      const response = await fetch(`${apiUrl}/contract-interactions/stats?${params}`);
      const data = await response.json();

      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  // Export to CSV
  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (studentId) params.append('studentId', studentId);
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (contractFilter) params.append('contractName', contractFilter);

      const response = await fetch(`${apiUrl}/contract-interactions/export?${params}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `interactions-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export interactions:', error);
    }
  };

  useEffect(() => {
    fetchInteractions();
    fetchStats();
  }, [page, searchTerm, statusFilter, contractFilter, studentId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
      case 'reverted':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'failed':
      case 'reverted':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  const truncateHash = (hash: string) => {
    if (!hash) return '-';
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 6)}`;
  };

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Total Interactions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.successful}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Successful</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.averageExecutionTime.toFixed(0)}ms
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Avg. Exec Time</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 border-b dark:border-gray-700">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by contract, function, or transaction hash..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
          <option value="reverted">Reverted</option>
        </select>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Interactions List */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : interactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            <AlertCircle className="w-12 h-12 mb-3" />
            <p>No interactions found</p>
            <p className="text-sm">Start deploying and calling contracts to see history</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contract
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Function
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Transaction Hash
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Gas Used
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {interactions.map((interaction) => (
                <tr
                  key={interaction.id}
                  onClick={() => setSelectedInteraction(interaction)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(interaction.status)}
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(interaction.status)}`}
                      >
                        {interaction.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {formatTimestamp(interaction.timestamp)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300 font-mono">
                    {interaction.contractName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300 font-mono">
                    {interaction.functionName}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300 font-mono">
                    {interaction.transactionHash ? (
                      <div className="flex items-center gap-2">
                        <span>{truncateHash(interaction.transactionHash)}</span>
                        <ExternalLink className="w-3 h-3 text-blue-500" />
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {interaction.gasUsed || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {interaction.executionTime ? `${interaction.executionTime}ms` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t dark:border-gray-700">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedInteraction && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedInteraction(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Interaction Details
                </h2>
                <button
                  onClick={() => setSelectedInteraction(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedInteraction.status)}
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded border ${getStatusColor(selectedInteraction.status)}`}
                    >
                      {selectedInteraction.status}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Contract Name
                  </label>
                  <p className="text-gray-900 dark:text-white font-mono">
                    {selectedInteraction.contractName}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Function Name
                  </label>
                  <p className="text-gray-900 dark:text-white font-mono">
                    {selectedInteraction.functionName}
                  </p>
                </div>

                {selectedInteraction.parameters && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Parameters
                    </label>
                    <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm overflow-auto">
                      {JSON.stringify(selectedInteraction.parameters, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedInteraction.result && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Result
                    </label>
                    <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm overflow-auto">
                      {JSON.stringify(selectedInteraction.result, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedInteraction.transactionHash && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Transaction Hash
                    </label>
                    <p className="text-gray-900 dark:text-white font-mono text-sm break-all">
                      {selectedInteraction.transactionHash}
                    </p>
                  </div>
                )}

                {selectedInteraction.errorMessage && (
                  <div>
                    <label className="block text-sm font-medium text-red-700 dark:text-red-400 mb-1">
                      Error Message
                    </label>
                    <p className="text-red-900 dark:text-red-300 bg-red-50 dark:bg-red-900/20 p-3 rounded">
                      {selectedInteraction.errorMessage}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Gas Used
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {selectedInteraction.gasUsed || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Execution Time
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {selectedInteraction.executionTime
                        ? `${selectedInteraction.executionTime}ms`
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Network
                  </label>
                  <p className="text-gray-900 dark:text-white">{selectedInteraction.network}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Timestamp
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(selectedInteraction.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
