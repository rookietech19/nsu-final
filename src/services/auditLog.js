import { addDocument } from './firestore';
import { COLLECTIONS } from '../config/firestore-schema';

/**
 * Audit Logging Service
 * Logs all important actions for compliance and debugging
 */

/**
 * Get client IP address (requires backend support)
 */
async function getClientIpAddress() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Error getting client IP:', error);
    return 'Unknown';
  }
}

/**
 * Log an audit event
 * @param {Object} eventData - Event data
 * @returns {Promise<string>} - Log document ID
 */
export async function logAuditEvent(eventData) {
  try {
    const {
      userId,
      action,
      collection = null,
      documentId = null,
      status,
      details,
      changes = null
    } = eventData;

    const ipAddress = await getClientIpAddress();

    const logEntry = {
      userId,
      action,
      collection,
      documentId,
      status,
      details,
      changes,
      ipAddress,
      userAgent: navigator.userAgent,
      timestamp: new Date(),
      // createdAt is added automatically by addDocument
    };

    const docId = await addDocument(COLLECTIONS.AUDIT_LOGS, logEntry);
    console.log(`Audit log created: ${action} - ${status}`);
    return docId;
  } catch (error) {
    console.error('Error logging audit event:', error);
    // Don't throw - audit logging should not break the main flow
  }
}

/**
 * Get audit logs for a specific user
 * @param {string} userId - User ID
 * @param {number} limit - Number of logs to retrieve
 * @returns {Promise<Array>} - Array of audit logs
 */
export async function getUserAuditLogs(userId, limit = 100) {
  try {
    const { queryDocuments, orderBy } = await import('firebase/firestore');
    
    const logs = await queryDocuments(COLLECTIONS.AUDIT_LOGS, [
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limitFunc(limit)
    ]);

    return logs;
  } catch (error) {
    console.error('Error getting user audit logs:', error);
    throw error;
  }
}

/**
 * Get audit logs for a specific action
 * @param {string} action - Action name
 * @param {number} limit - Number of logs to retrieve
 * @returns {Promise<Array>} - Array of audit logs
 */
export async function getActionAuditLogs(action, limit = 100) {
  try {
    const { queryDocuments } = await import('firebase/firestore');
    const { where: whereConstraint, orderBy: orderByConstraint, limit: limitConstraint } = await import('firebase/firestore');
    
    const logs = await queryDocuments(COLLECTIONS.AUDIT_LOGS, [
      whereConstraint('action', '==', action),
      orderByConstraint('timestamp', 'desc'),
      limitConstraint(limit)
    ]);

    return logs;
  } catch (error) {
    console.error('Error getting action audit logs:', error);
    throw error;
  }
}

/**
 * Get all audit logs (admin only)
 * @param {number} limit - Number of logs to retrieve
 * @returns {Promise<Array>} - Array of audit logs
 */
export async function getAllAuditLogs(limit = 1000) {
  try {
    const { queryDocuments, orderBy: orderByConstraint, limit: limitConstraint } = await import('firebase/firestore');
    
    const logs = await queryDocuments(COLLECTIONS.AUDIT_LOGS, [
      orderByConstraint('timestamp', 'desc'),
      limitConstraint(limit)
    ]);

    return logs;
  } catch (error) {
    console.error('Error getting all audit logs:', error);
    throw error;
  }
}

/**
 * Get audit logs for a date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} - Array of audit logs
 */
export async function getAuditLogsByDateRange(startDate, endDate) {
  try {
    const { queryDocuments, where: whereConstraint, orderBy: orderByConstraint } = await import('firebase/firestore');
    
    const logs = await queryDocuments(COLLECTIONS.AUDIT_LOGS, [
      whereConstraint('timestamp', '>=', startDate),
      whereConstraint('timestamp', '<=', endDate),
      orderByConstraint('timestamp', 'desc')
    ]);

    return logs;
  } catch (error) {
    console.error('Error getting audit logs by date range:', error);
    throw error;
  }
}

/**
 * Export audit logs as CSV
 * @param {Array} logs - Array of audit logs
 * @returns {Promise<void>} - Downloads CSV file
 */
export async function exportAuditLogsAsCSV(logs) {
  try {
    const headers = ['Timestamp', 'User ID', 'Action', 'Status', 'Collection', 'Document ID', 'IP Address', 'Details'];
    const rows = logs.map(log => [
      log.timestamp?.toDate?.().toISOString() || new Date(log.timestamp).toISOString(),
      log.userId,
      log.action,
      log.status,
      log.collection || '',
      log.documentId || '',
      log.ipAddress,
      log.details
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_logs_${new Date().toISOString()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    throw error;
  }
}

/**
 * Log user authentication events
 * @param {string} userId - User ID
 * @param {string} eventType - 'LOGIN', 'LOGOUT', 'LOGIN_FAILED'
 */
export async function logAuthEvent(userId, eventType) {
  return logAuditEvent({
    userId: userId || 'Anonymous',
    action: `AUTH_${eventType}`,
    status: 'Success',
    details: `User ${eventType.toLowerCase()}`
  });
}

/**
 * Log data modification events
 * @param {string} userId - User ID
 * @param {string} operation - 'CREATE', 'UPDATE', 'DELETE'
 * @param {string} collection - Collection name
 * @param {string} documentId - Document ID
 * @param {Object} changes - What changed
 */
export async function logDataModification(userId, operation, collection, documentId, changes = null) {
  return logAuditEvent({
    userId,
    action: `DATA_${operation}`,
    collection,
    documentId,
    status: 'Success',
    changes,
    details: `${operation} in ${collection}`
  });
}

/**
 * Log backup operations
 * @param {string} userId - User ID
 * @param {string} operation - 'BACKUP_START', 'BACKUP_COMPLETED', 'RESTORE_START', etc.
 * @param {string} status - 'Pending', 'Success', 'Failure'
 * @param {string} details - Details of the operation
 */
export async function logBackupOperation(userId, operation, status, details) {
  return logAuditEvent({
    userId,
    action: operation,
    status,
    details
  });
}
