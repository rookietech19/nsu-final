import React, { useState, useEffect, useContext } from 'react';
import { LogOut, Download, Filter, Search, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { getAllAuditLogs, getAuditLogsByDateRange, exportAuditLogsAsCSV } from '../services/auditLog';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';

/**
 * Audit Log Viewer
 * View all system operations and backup activities
 */
const AuditLogViewer = () => {
  const { user } = useContext(AuthContext);
  const { showNotification } = useContext(NotificationContext);

  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date()
  });

  // Check authorization
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-3">
          <AlertCircle className="text-red-600" size={24} />
          <div>
            <h3 className="font-semibold text-red-900">Access Denied</h3>
            <p className="text-red-700 text-sm">Only administrators can view audit logs.</p>
          </div>
        </div>
      </div>
    );
  }

  // Load audit logs
  useEffect(() => {
    loadAuditLogs();
  }, []);

  // Apply filters whenever search/filter values change
  useEffect(() => {
    applyFilters();
  }, [logs, searchTerm, filterAction, filterStatus]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const allLogs = await getAllAuditLogs(1000);
      setLogs(allLogs);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      showNotification('error', 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...logs];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.userId?.includes(searchTerm) ||
        log.action?.includes(searchTerm) ||
        log.details?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by action
    if (filterAction !== 'ALL') {
      filtered = filtered.filter(log => log.action === filterAction);
    }

    // Filter by status
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(log => log.status === filterStatus);
    }

    setFilteredLogs(filtered);
  };

  const handleExportCSV = async () => {
    try {
      await exportAuditLogsAsCSV(filteredLogs);
      showNotification('success', 'Audit logs exported successfully');
    } catch (error) {
      console.error('Error exporting logs:', error);
      showNotification('error', 'Failed to export logs');
    }
  };

  const getActionBadgeColor = (action) => {
    if (action.includes('BACKUP')) return 'bg-blue-100 text-blue-800';
    if (action.includes('RESTORE')) return 'bg-purple-100 text-purple-800';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-800';
    if (action.includes('AUTH')) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    return status === 'Success' ? (
      <CheckCircle size={16} className="text-green-600" />
    ) : (
      <AlertCircle size={16} className="text-red-600" />
    );
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = date.toDate?.() || new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-2">Audit Log Viewer</h1>
        <p className="text-purple-100">Monitor all system operations and backup activities</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Total Logs</p>
          <p className="text-3xl font-bold text-gray-900">{logs.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Displayed</p>
          <p className="text-3xl font-bold text-gray-900">{filteredLogs.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Success Rate</p>
          <p className="text-3xl font-bold text-green-600">
            {logs.length > 0 ? Math.round((logs.filter(l => l.status === 'Success').length / logs.length) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search logs..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="ALL">All Actions</option>
              <option value="BACKUP_COMPLETED">Backup Completed</option>
              <option value="RESTORE_COMPLETED">Restore Completed</option>
              <option value="BACKUP_START">Backup Started</option>
              <option value="RESTORE_START">Restore Started</option>
              <option value="MANUAL_BACKUP">Manual Backup</option>
              <option value="AUTH_LOGIN">User Login</option>
              <option value="AUTH_LOGOUT">User Logout</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="ALL">All Status</option>
              <option value="Success">Success</option>
              <option value="Failure">Failure</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleExportCSV}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition"
            >
              <Download size={18} />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">Audit Trail</h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-gray-500">Loading audit logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex justify-center items-center py-12 text-gray-500">
            <p>No audit logs found matching the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Timestamp</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">User</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Details</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {log.userId || 'System'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        <span className={log.status === 'Success' ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                          {log.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="max-w-xs truncate" title={log.details}>
                        {log.details}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {log.ipAddress || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogViewer;
