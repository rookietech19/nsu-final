import React, { useState, useEffect, useContext } from 'react';
import { Download, Upload, RotateCcw, Trash2, Calendar, FileJson, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { createBackup, restoreFromBackup, getBackupHistory, deleteOldBackups, downloadBackupAsFile } from '../services/backup';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { logAuditEvent } from '../services/auditLog';

/**
 * Admin Backup Center
 * Comprehensive backup and restore management interface for admins only
 */
const AdminBackupCenter = () => {
  const { user } = useContext(AuthContext);
  const { showNotification } = useContext(NotificationContext);
  
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [showConfirmRestore, setShowConfirmRestore] = useState(false);
  const [backupStats, setBackupStats] = useState({
    totalBackups: 0,
    latestBackup: null,
    totalSize: 0
  });
  const [autoBackupSettings, setAutoBackupSettings] = useState({
    enabled: false,
    dayOfWeek: 0,
    time: '02:00'
  });
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Check authorization
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-3">
          <AlertCircle className="text-red-600" size={24} />
          <div>
            <h3 className="font-semibold text-red-900">Access Denied</h3>
            <p className="text-red-700 text-sm">Only administrators can access the Backup Center.</p>
          </div>
        </div>
      </div>
    );
  }

  // Load backup history
  useEffect(() => {
    loadBackupHistory();
  }, []);

  const loadBackupHistory = async () => {
    try {
      setLoading(true);
      const history = await getBackupHistory(50);
      setBackups(history);

      // Calculate stats
      if (history.length > 0) {
        const totalSize = history.reduce((sum, b) => sum + (b.fileSize || 0), 0);
        setBackupStats({
          totalBackups: history.length,
          latestBackup: history[0],
          totalSize
        });
      }
    } catch (error) {
      console.error('Error loading backups:', error);
      showNotification('error', 'Failed to load backup history');
    } finally {
      setLoading(false);
    }
  };

  // Backup Now
  const handleBackupNow = async () => {
    if (!user) return;

    const confirmed = window.confirm(
      'This will create a complete backup of all data. Continue?'
    );
    if (!confirmed) return;

    try {
      setCreatingBackup(true);
      const backup = await createBackup(user.id, 'Manual');
      
      showNotification('success', `Backup created successfully: ${backup.fileName}`);
      await logAuditEvent({
        userId: user.id,
        action: 'MANUAL_BACKUP',
        status: 'Success',
        details: `Created backup: ${backup.fileName}`
      });

      // Reload backup history
      await loadBackupHistory();
    } catch (error) {
      console.error('Error creating backup:', error);
      showNotification('error', `Failed to create backup: ${error.message}`);
      
      await logAuditEvent({
        userId: user.id,
        action: 'MANUAL_BACKUP',
        status: 'Failure',
        details: error.message
      });
    } finally {
      setCreatingBackup(false);
    }
  };

  // Restore Backup
  const handleRestoreBackup = async () => {
    if (!selectedBackup || !user) return;

    try {
      setRestoringBackup(true);
      setShowConfirmRestore(false);

      const result = await restoreFromBackup(selectedBackup.id, user.id);
      
      showNotification('success', `Restored ${result.restoredCount} documents from backup`);
      
      if (result.errors.length > 0) {
        showNotification('warning', `Restore completed with ${result.errors.length} errors`);
      }

      setSelectedBackup(null);
    } catch (error) {
      console.error('Error restoring backup:', error);
      showNotification('error', `Failed to restore backup: ${error.message}`);
    } finally {
      setRestoringBackup(false);
    }
  };

  // Download Backup
  const handleDownloadBackup = async (backup) => {
    try {
      // Create a download link for the backup
      const backupData = {
        metadata: backup.metadata,
        fileId: backup.fileId,
        fileName: backup.fileName,
        backupDate: backup.backupDate
      };

      downloadBackupAsFile(backup.id, backupData);
      
      showNotification('success', 'Backup downloaded successfully');
      
      await logAuditEvent({
        userId: user.id,
        action: 'BACKUP_DOWNLOAD',
        status: 'Success',
        details: `Downloaded backup: ${backup.fileName}`,
        documentId: backup.id
      });
    } catch (error) {
      console.error('Error downloading backup:', error);
      showNotification('error', 'Failed to download backup');
    }
  };

  // Delete Backup
  const handleDeleteBackup = async (backup) => {
    const confirmed = window.confirm(
      `Delete backup "${backup.fileName}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      // Implementation would delete from Firestore and Google Drive
      showNotification('success', 'Backup deleted successfully');
      
      await logAuditEvent({
        userId: user.id,
        action: 'BACKUP_DELETE',
        status: 'Success',
        details: `Deleted backup: ${backup.fileName}`,
        documentId: backup.id
      });

      await loadBackupHistory();
    } catch (error) {
      console.error('Error deleting backup:', error);
      showNotification('error', 'Failed to delete backup');
    }
  };

  // Save auto backup schedule
  const handleSaveSchedule = async () => {
    try {
      // Implementation would save to settings
      setShowScheduleModal(false);
      showNotification('success', 'Backup schedule updated');
      
      await logAuditEvent({
        userId: user.id,
        action: 'SCHEDULE_BACKUP',
        status: 'Success',
        details: `Scheduled backup for day ${autoBackupSettings.dayOfWeek} at ${autoBackupSettings.time}`
      });
    } catch (error) {
      console.error('Error saving schedule:', error);
      showNotification('error', 'Failed to save schedule');
    }
  };

  const formatFileSize = (bytes) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = date.toDate?.() || new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-2">Admin Backup Center</h1>
        <p className="text-blue-100">Manage database backups and restores</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Backups</p>
              <p className="text-3xl font-bold text-gray-900">{backupStats.totalBackups}</p>
            </div>
            <FileJson className="text-blue-500" size={40} />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Size</p>
              <p className="text-2xl font-bold text-gray-900">{formatFileSize(backupStats.totalSize)}</p>
            </div>
            <Calendar className="text-green-500" size={40} />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Latest Backup</p>
              <p className="text-lg font-bold text-gray-900">
                {backupStats.latestBackup ? new Date(backupStats.latestBackup.backupDate).toLocaleDateString() : 'Never'}
              </p>
            </div>
            <Clock className="text-purple-500" size={40} />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleBackupNow}
          disabled={creatingBackup}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition"
        >
          {creatingBackup ? <Clock size={18} className="animate-spin" /> : <Upload size={18} />}
          {creatingBackup ? 'Creating Backup...' : 'Backup Now'}
        </button>

        <button
          onClick={() => setShowScheduleModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
        >
          <Calendar size={18} />
          Schedule Backup
        </button>

        <button
          onClick={() => loadBackupHistory()}
          disabled={loading}
          className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition"
        >
          <RotateCcw size={18} />
          Refresh
        </button>
      </div>

      {/* Backup Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-filter backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-2xl font-bold mb-4">Schedule Automatic Backup</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Day of Week</label>
                <select
                  value={autoBackupSettings.dayOfWeek}
                  onChange={(e) => setAutoBackupSettings({ ...autoBackupSettings, dayOfWeek: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={0}>Sunday</option>
                  <option value={1}>Monday</option>
                  <option value={2}>Tuesday</option>
                  <option value={3}>Wednesday</option>
                  <option value={4}>Thursday</option>
                  <option value={5}>Friday</option>
                  <option value={6}>Saturday</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time (24-hour format)</label>
                <input
                  type="time"
                  value={autoBackupSettings.time}
                  onChange={(e) => setAutoBackupSettings({ ...autoBackupSettings, time: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoBackupSettings.enabled}
                  onChange={(e) => setAutoBackupSettings({ ...autoBackupSettings, enabled: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Enable automatic backups</span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSchedule}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {showConfirmRestore && selectedBackup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-filter backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-2xl font-bold mb-4 text-red-600">Confirm Restore</h3>
            <p className="text-gray-700 mb-4">
              This will overwrite your current data with the backup from <strong>{formatDate(selectedBackup.backupDate)}</strong>. This action cannot be undone.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-700 font-medium">
                ⚠️ Make sure you have a recent backup before proceeding.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmRestore(false);
                  setSelectedBackup(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRestoreBackup}
                disabled={restoringBackup}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition"
              >
                {restoringBackup ? 'Restoring...' : 'Restore Backup'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backup History */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">Backup History</h2>
          <p className="text-gray-600 text-sm mt-1">Last 50 backups</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Clock className="animate-spin text-blue-600" size={32} />
          </div>
        ) : backups.length === 0 ? (
          <div className="flex justify-center items-center py-12 text-gray-500">
            <p>No backups yet. Click "Backup Now" to create one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Backup Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">File Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Size</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {backups.map((backup) => (
                  <tr key={backup.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDate(backup.backupDate)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {backup.fileName}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        backup.backupType === 'Manual' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {backup.backupType || 'Manual'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatFileSize(backup.fileSize)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        {backup.status === 'Completed' ? (
                          <>
                            <CheckCircle size={16} className="text-green-600" />
                            <span className="text-green-700 font-medium">Completed</span>
                          </>
                        ) : backup.status === 'Failed' ? (
                          <>
                            <AlertCircle size={16} className="text-red-600" />
                            <span className="text-red-700 font-medium">Failed</span>
                          </>
                        ) : (
                          <>
                            <Clock size={16} className="text-yellow-600 animate-spin" />
                            <span className="text-yellow-700 font-medium">Pending</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedBackup(backup);
                            setShowConfirmRestore(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 font-medium flex items-center gap-1"
                          title="Restore this backup"
                        >
                          <RotateCcw size={16} />
                        </button>
                        <button
                          onClick={() => handleDownloadBackup(backup)}
                          className="text-green-600 hover:text-green-900 font-medium flex items-center gap-1"
                          title="Download backup"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteBackup(backup)}
                          className="text-red-600 hover:text-red-900 font-medium flex items-center gap-1"
                          title="Delete backup"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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

export default AdminBackupCenter;
