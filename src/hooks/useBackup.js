import { useEffect, useRef } from 'react';
import { initializeBackupScheduler, stopBackupScheduler } from '../services/backupScheduler';

/**
 * useBackupScheduler Hook
 * Initialize and manage backup scheduler lifecycle
 * 
 * @param {string} adminUserId - Admin user ID for backups
 * @param {boolean} enabled - Whether to enable scheduler
 */
export function useBackupScheduler(adminUserId, enabled = true) {
  const schedulerRef = useRef(null);

  useEffect(() => {
    if (enabled && adminUserId) {
      // Initialize scheduler
      initializeBackupScheduler(adminUserId);
      schedulerRef.current = true;

      // Cleanup on unmount
      return () => {
        if (schedulerRef.current) {
          stopBackupScheduler();
          schedulerRef.current = false;
        }
      };
    }
  }, [adminUserId, enabled]);

  return {
    isRunning: schedulerRef.current === true
  };
}

/**
 * useBackupHistory Hook
 * Fetch and manage backup history
 * 
 * @param {number} limit - Number of backups to retrieve
 */
export function useBackupHistory(limit = 50) {
  const [backups, setBackups] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const fetchBackups = React.useCallback(async () => {
    try {
      setLoading(true);
      const { getBackupHistory } = await import('../services/backup');
      const history = await getBackupHistory(limit);
      setBackups(history);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching backup history:', err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  React.useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  return { backups, loading, error, refetch: fetchBackups };
}

/**
 * useAuditLogs Hook
 * Fetch and manage audit logs
 * 
 * @param {number} limit - Number of logs to retrieve
 */
export function useAuditLogs(limit = 100) {
  const [logs, setLogs] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const fetchLogs = React.useCallback(async () => {
    try {
      setLoading(true);
      const { getAllAuditLogs } = await import('../services/auditLog');
      const auditLogs = await getAllAuditLogs(limit);
      setLogs(auditLogs);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  React.useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, loading, error, refetch: fetchLogs };
}
