/**
 * Backup Scheduler Service
 * Handles automatic weekly backups
 */

import { createBackup, shouldRunAutoBackup } from './backup';
import { logAuditEvent } from './auditLog';

let backupScheduler = null;

/**
 * Initialize backup scheduler
 * Checks every hour if automatic backup should run
 * @param {string} adminUserId - Admin user ID for backup logging
 */
export function initializeBackupScheduler(adminUserId) {
  // Check every hour if backup should run
  backupScheduler = setInterval(async () => {
    try {
      const shouldRun = await shouldRunAutoBackup();
      
      if (shouldRun) {
        console.log('Starting automatic backup...');
        await createBackup(adminUserId, 'Automatic');
        console.log('Automatic backup completed');
      }
    } catch (error) {
      console.error('Error in backup scheduler:', error);
      
      // Log the error
      await logAuditEvent({
        userId: adminUserId,
        action: 'AUTO_BACKUP_ERROR',
        status: 'Failure',
        details: error.message
      });
    }
  }, 60 * 60 * 1000); // Run every hour

  console.log('Backup scheduler initialized');
}

/**
 * Stop backup scheduler
 */
export function stopBackupScheduler() {
  if (backupScheduler) {
    clearInterval(backupScheduler);
    backupScheduler = null;
    console.log('Backup scheduler stopped');
  }
}

/**
 * Get next scheduled backup time
 * @returns {Promise<Date|null>} - Next backup time or null
 */
export async function getNextScheduledBackupTime() {
  try {
    const { getDocument } = await import('./firestore');
    const { COLLECTIONS } = await import('../config/firestore-schema');
    
    const settings = await getDocument(COLLECTIONS.SETTINGS, 'backup-schedule');
    
    if (!settings || !settings.backupSchedule?.enabled) {
      return null;
    }

    const now = new Date();
    const currentDay = now.getDay();
    const targetDay = settings.backupSchedule.dayOfWeek;
    const [hour, minute] = settings.backupSchedule.time.split(':');

    // Calculate next backup time
    let nextBackup = new Date(now);
    nextBackup.setHours(parseInt(hour), parseInt(minute), 0, 0);

    // If today is the target day and time hasn't passed
    if (currentDay === targetDay && nextBackup > now) {
      return nextBackup;
    }

    // Calculate days until next target day
    let daysUntilTarget = targetDay - currentDay;
    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7;
    }

    nextBackup.setDate(nextBackup.getDate() + daysUntilTarget);
    nextBackup.setHours(parseInt(hour), parseInt(minute), 0, 0);

    return nextBackup;
  } catch (error) {
    console.error('Error getting next scheduled backup time:', error);
    return null;
  }
}

/**
 * Manually trigger a backup check
 * @param {string} adminUserId - Admin user ID
 * @returns {Promise<boolean>} - True if backup was run
 */
export async function checkAndRunBackupIfScheduled(adminUserId) {
  try {
    const shouldRun = await shouldRunAutoBackup();
    
    if (shouldRun) {
      const { createBackup } = await import('./backup');
      await createBackup(adminUserId, 'Automatic');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking backup schedule:', error);
    return false;
  }
}

/**
 * Get backup scheduler status
 * @returns {Object} - Scheduler status
 */
export function getBackupSchedulerStatus() {
  return {
    active: backupScheduler !== null,
    nextCheck: backupScheduler ? 'Within 1 hour' : 'Not running'
  };
}

/**
 * Force immediate backup (for testing)
 * @param {string} adminUserId - Admin user ID
 * @returns {Promise<Object>} - Backup result
 */
export async function forceImmediateBackup(adminUserId) {
  try {
    const { createBackup } = await import('./backup');
    const result = await createBackup(adminUserId, 'Manual');
    
    console.log('Forced backup completed:', result);
    return result;
  } catch (error) {
    console.error('Error forcing backup:', error);
    throw error;
  }
}
