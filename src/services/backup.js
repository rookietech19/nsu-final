import { getAllDocuments, addDocument, updateDocument, batchWrite, getCollectionSize } from './firestore';
import { BACKUP_COLLECTION_LIST, COLLECTIONS } from '../config/firestore-schema';
import { uploadBackupToGoogleDrive, getGoogleDriveAuthToken } from './googleDrive';
import { logAuditEvent } from './auditLog';

/**
 * Backup Service - Handle all backup and restore operations
 */

/**
 * Create a complete backup of all collections
 * @param {string} userId - User ID performing backup
 * @param {string} backupType - 'Manual' or 'Automatic'
 * @returns {Promise<Object>} - Backup metadata
 */
export async function createBackup(userId, backupType = 'Manual') {
  const backupId = `backup_${Date.now()}`;
  const backupDate = new Date();
  
  try {
    // Log backup start
    await logAuditEvent({
      userId,
      action: 'BACKUP_START',
      status: 'Pending',
      details: `Starting ${backupType} backup`
    });

    // Collect all collections data
    console.log('Starting backup collection...');
    const backupData = {
      metadata: {
        backupDate: backupDate.toISOString(),
        backupType,
        version: '1.0'
      },
      collections: {}
    };

    let totalSize = 0;
    const collectionsIncluded = [];

    for (const collectionName of BACKUP_COLLECTION_LIST) {
      try {
        console.log(`Backing up collection: ${collectionName}`);
        const docs = await getAllDocuments(collectionName);
        backupData.collections[collectionName] = docs;
        collectionsIncluded.push(collectionName);
        
        // Estimate size
        const collectionSize = JSON.stringify(docs).length;
        totalSize += collectionSize;
      } catch (error) {
        console.error(`Error backing up collection ${collectionName}:`, error);
        backupData.collections[collectionName] = [];
      }
    }

    // Create backup JSON
    const backupJSON = JSON.stringify(backupData, null, 2);
    const backupBlob = new Blob([backupJSON], { type: 'application/json' });
    const fileName = `acadflow_backup_${backupDate.toISOString().split('T')[0]}_${Date.now()}.json`;

    // Upload to Google Drive
    console.log('Uploading backup to Google Drive...');
    let fileId = null;
    try {
      const token = await getGoogleDriveAuthToken();
      if (token) {
        fileId = await uploadBackupToGoogleDrive(backupBlob, fileName);
      }
    } catch (error) {
      console.warn('Google Drive upload failed:', error);
      // Continue without Google Drive upload
    }

    // Save backup metadata to Firestore
    const backupMetadata = {
      fileId: fileId || null,
      fileName,
      backupDate: backupDate,
      fileSize: backupBlob.size,
      backupType,
      createdBy: userId,
      metadata: {
        collectionsIncluded,
        documentCount: Object.values(backupData.collections).reduce((sum, docs) => sum + docs.length, 0),
        totalSize
      },
      collectionsIncluded,
      status: 'Completed',
      errorMessage: null
    };

    const savedBackupId = await addDocument(COLLECTIONS.BACKUPS, backupMetadata);

    // Log successful backup
    await logAuditEvent({
      userId,
      action: 'BACKUP_COMPLETED',
      status: 'Success',
      details: `Backup created: ${fileName}`,
      documentId: savedBackupId
    });

    return {
      id: savedBackupId,
      ...backupMetadata
    };
  } catch (error) {
    console.error('Error creating backup:', error);

    // Log failed backup
    await logAuditEvent({
      userId,
      action: 'BACKUP_FAILED',
      status: 'Failure',
      details: error.message
    });

    throw error;
  }
}

/**
 * Restore data from a backup
 * @param {string} backupId - Backup ID to restore
 * @param {string} userId - User ID performing restore
 * @returns {Promise<Object>} - Restore result
 */
export async function restoreFromBackup(backupId, userId) {
  try {
    // Log restore start
    await logAuditEvent({
      userId,
      action: 'RESTORE_START',
      status: 'Pending',
      details: `Starting restore from backup: ${backupId}`
    });

    // Get backup data (from local storage or Google Drive)
    const backupData = await downloadBackupData(backupId);

    if (!backupData || !backupData.collections) {
      throw new Error('Invalid backup data');
    }

    let restoredCount = 0;
    const errors = [];

    // Restore each collection
    for (const [collectionName, documents] of Object.entries(backupData.collections)) {
      try {
        console.log(`Restoring collection: ${collectionName}`);
        const operations = documents.map(doc => ({
          type: 'set',
          collection: collectionName,
          docId: doc.id,
          data: doc
        }));

        if (operations.length > 0) {
          // Batch operations in chunks of 500
          for (let i = 0; i < operations.length; i += 500) {
            await batchWrite(operations.slice(i, i + 500));
          }
        }

        restoredCount += documents.length;
      } catch (error) {
        const errorMsg = `Error restoring collection ${collectionName}: ${error.message}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    // Log successful restore
    await logAuditEvent({
      userId,
      action: 'RESTORE_COMPLETED',
      status: 'Success',
      details: `Restored ${restoredCount} documents from backup ${backupId}`
    });

    return {
      success: true,
      restoredCount,
      errors
    };
  } catch (error) {
    console.error('Error restoring from backup:', error);

    // Log failed restore
    await logAuditEvent({
      userId,
      action: 'RESTORE_FAILED',
      status: 'Failure',
      details: error.message
    });

    throw error;
  }
}

/**
 * Download backup data (from local storage or implement Google Drive API call)
 * @param {string} backupId - Backup ID
 * @returns {Promise<Object>} - Backup data
 */
async function downloadBackupData(backupId) {
  // This would typically download from Google Drive using the fileId
  // For now, return placeholder - implement with Google Drive API
  const backupJSON = localStorage.getItem(`backup_${backupId}`);
  if (backupJSON) {
    return JSON.parse(backupJSON);
  }
  throw new Error('Backup data not found');
}

/**
 * Export backup as JSON file (browser download)
 * @param {string} backupId - Backup ID
 * @param {Object} backupData - Backup data
 */
export function downloadBackupAsFile(backupId, backupData) {
  try {
    const backupJSON = JSON.stringify(backupData, null, 2);
    const blob = new Blob([backupJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_${backupId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading backup:', error);
    throw error;
  }
}

/**
 * Get backup history
 * @param {number} limit - Number of backups to retrieve (default 50)
 * @returns {Promise<Array>} - Array of backup metadata
 */
export async function getBackupHistory(limitCount = 50) {
  try {
    // Import here to avoid circular dependencies
    const { queryDocuments } = await import('./firestore');
    const { orderBy: orderByConstraint } = await import('firebase/firestore');
    
    const backups = await queryDocuments(COLLECTIONS.BACKUPS, [
      orderByConstraint('backupDate', 'desc'),
      limitCount
    ]);
    
    return backups;
  } catch (error) {
    console.error('Error getting backup history:', error);
    throw error;
  }
}

/**
 * Delete old backups (keep only recent ones)
 * @param {string} userId - User ID performing deletion
 * @param {number} keepCount - Number of recent backups to keep
 * @returns {Promise<number>} - Number of deleted backups
 */
export async function deleteOldBackups(userId, keepCount = 10) {
  try {
    const { deleteDocument, queryDocuments } = await import('./firestore');
    const { orderBy: orderByConstraint } = await import('firebase/firestore');
    
    const allBackups = await queryDocuments(COLLECTIONS.BACKUPS, [
      orderByConstraint('backupDate', 'desc')
    ]);

    if (allBackups.length <= keepCount) {
      return 0;
    }

    const backupsToDelete = allBackups.slice(keepCount);
    let deletedCount = 0;

    for (const backup of backupsToDelete) {
      try {
        await deleteDocument(COLLECTIONS.BACKUPS, backup.id);
        deletedCount++;
      } catch (error) {
        console.error(`Error deleting backup ${backup.id}:`, error);
      }
    }

    // Log cleanup
    await logAuditEvent({
      userId,
      action: 'BACKUP_CLEANUP',
      status: 'Success',
      details: `Deleted ${deletedCount} old backups, keeping ${keepCount} recent ones`
    });

    return deletedCount;
  } catch (error) {
    console.error('Error deleting old backups:', error);
    throw error;
  }
}

/**
 * Schedule automatic weekly backup
 * @param {string} userId - Admin user ID
 * @param {string} dayOfWeek - Day to run backup (0-6, where 0 is Sunday)
 * @param {string} time - Time to run backup (HH:MM format)
 * @returns {Promise<void>}
 */
export async function scheduleWeeklyBackup(userId, dayOfWeek = 0, time = '02:00') {
  try {
    // Save schedule to settings
    const { updateDocument, getDocument } = await import('./firestore');
    
    let settings = await getDocument(COLLECTIONS.SETTINGS, 'backup-schedule');
    
    if (!settings) {
      const { addDocument } = await import('./firestore');
      await addDocument(COLLECTIONS.SETTINGS, {
        docId: 'backup-schedule',
        backupSchedule: {
          enabled: true,
          dayOfWeek,
          time,
          lastRun: null
        }
      });
    } else {
      await updateDocument(COLLECTIONS.SETTINGS, 'backup-schedule', {
        backupSchedule: {
          enabled: true,
          dayOfWeek,
          time,
          lastRun: settings.backupSchedule?.lastRun || null
        }
      });
    }

    await logAuditEvent({
      userId,
      action: 'SCHEDULE_BACKUP',
      status: 'Success',
      details: `Scheduled weekly backup for day ${dayOfWeek} at ${time}`
    });
  } catch (error) {
    console.error('Error scheduling backup:', error);
    throw error;
  }
}

/**
 * Check if automatic backup should run
 * @returns {Promise<boolean>} - True if backup should run
 */
export async function shouldRunAutoBackup() {
  try {
    const { getDocument } = await import('./firestore');
    const settings = await getDocument(COLLECTIONS.SETTINGS, 'backup-schedule');
    
    if (!settings || !settings.backupSchedule?.enabled) {
      return false;
    }

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Check if it's the right day and time (within 1-minute window)
    if (currentDay === settings.backupSchedule.dayOfWeek) {
      const [schedHour, schedMin] = settings.backupSchedule.time.split(':');
      const [currentHour, currentMin] = currentTime.split(':');
      
      if (currentHour === schedHour && currentMin === schedMin) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking auto backup:', error);
    return false;
  }
}
