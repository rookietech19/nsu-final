# Firebase Integration Testing Guide

## Pre-Testing Checklist

- [ ] Node disk space freed up to >200 MB
- [ ] `npm install firebase` completed
- [ ] `.env.local` created with Firebase credentials
- [ ] Firebase project created and Firestore enabled
- [ ] Google Drive API credentials set up
- [ ] Security rules deployed
- [ ] AuthContext.jsx updated to use Firebase auth

## Unit Testing Firestore Operations

### Test 1: Firebase Connection

```javascript
// In browser console
import { db, app } from './config/firebase.js';

console.log('Firebase app:', app);
console.log('Firestore instance:', db);
```

**Expected**: Both should show initialized objects.

### Test 2: Document Creation

```javascript
import { addDocument } from './services/firestore.js';

async function testCreate() {
  try {
    const docId = await addDocument('students', {
      name: 'Test Student',
      email: 'test@example.com',
      status: 'Active'
    });
    console.log('Document created:', docId);
  } catch (error) {
    console.error('Create error:', error);
  }
}

testCreate();
```

**Expected**: Returns a string document ID.

### Test 3: Document Read

```javascript
import { getDocument } from './services/firestore.js';

async function testRead() {
  try {
    const doc = await getDocument('students', '<docId>');
    console.log('Document:', doc);
  } catch (error) {
    console.error('Read error:', error);
  }
}

testRead();
```

**Expected**: Returns the document with all fields.

### Test 4: Query Operations

```javascript
import { queryByField } from './services/firestore.js';

async function testQuery() {
  try {
    const results = await queryByField('students', 'status', 'Active');
    console.log('Query results:', results);
  } catch (error) {
    console.error('Query error:', error);
  }
}

testQuery();
```

**Expected**: Returns array of matching documents.

## Integration Testing

### Test 5: Backup Creation

```javascript
import { createBackup } from './services/backup.js';

async function testBackup() {
  const userId = 'admin-user-id';
  
  try {
    const backup = await createBackup(userId, 'Manual');
    console.log('Backup created:', backup);
  } catch (error) {
    console.error('Backup error:', error);
  }
}

testBackup();
```

**Expected**: Backup metadata object with fileId, fileName, etc.

### Test 6: Backup History

```javascript
import { getBackupHistory } from './services/backup.js';

async function testHistory() {
  try {
    const history = await getBackupHistory(10);
    console.log('Backup history:', history);
  } catch (error) {
    console.error('History error:', error);
  }
}

testHistory();
```

**Expected**: Array of backup metadata objects.

### Test 7: Audit Logging

```javascript
import { logAuditEvent } from './services/auditLog.js';

async function testAuditLog() {
  try {
    const logId = await logAuditEvent({
      userId: 'test-user',
      action: 'TEST_ACTION',
      status: 'Success',
      details: 'This is a test audit log'
    });
    console.log('Audit log created:', logId);
  } catch (error) {
    console.error('Audit log error:', error);
  }
}

testAuditLog();
```

**Expected**: Returns log document ID.

## UI Component Testing

### Test 8: Admin Backup Center Component

1. Navigate to Admin Backup Center in the UI
2. Verify you see:
   - [ ] Stats cards (Total Backups, Total Size, Latest Backup)
   - [ ] "Backup Now" button
   - [ ] "Schedule Backup" button
   - [ ] Backup history table
3. Click "Backup Now"
   - [ ] Button shows loading state
   - [ ] Confirmation dialog appears
   - [ ] Backup completes successfully
   - [ ] New backup appears in history table

### Test 9: Audit Log Viewer

1. Navigate to Audit Log Viewer
2. Verify you see:
   - [ ] Stats cards showing log counts
   - [ ] Filter options (search, action, status)
   - [ ] Export CSV button
   - [ ] Audit logs table with recent entries
3. Test filtering:
   - [ ] Search for a user ID
   - [ ] Filter by action
   - [ ] Filter by status
4. Export logs:
   - [ ] Click "Export CSV"
   - [ ] CSV file downloads
   - [ ] CSV opens in spreadsheet app

## Google Drive Integration Testing

### Test 10: Google Drive Connection

```javascript
import { checkGoogleDriveConnectivity } from './services/googleDrive.js';

async function testGoogleDrive() {
  try {
    const connected = await checkGoogleDriveConnectivity();
    console.log('Google Drive connected:', connected);
  } catch (error) {
    console.error('Google Drive error:', error);
  }
}

testGoogleDrive();
```

**Expected**: Returns `true` if connected.

### Test 11: Backup Upload to Google Drive

During backup creation, verify:
- [ ] File appears in Google Drive backup folder
- [ ] File name matches expected format
- [ ] File is readable JSON
- [ ] File ID is saved in Firestore

## Data Migration Testing

### Test 12: Base44 to Firestore Migration

```javascript
import { migrateFromBase44ToFirestore, validateMigration } from './services/migration.js';
import base44 from '@base44/sdk';

async function testMigration() {
  try {
    // Run migration
    const results = await migrateFromBase44ToFirestore(base44);
    console.log('Migration results:', results);
    
    // Validate
    const validation = await validateMigration(base44);
    console.log('Validation:', validation);
  } catch (error) {
    console.error('Migration error:', error);
  }
}

testMigration();
```

**Expected**: 
- Migration shows document counts for each collection
- Validation confirms all documents migrated correctly
- Document counts match

## Performance Testing

### Test 13: Large Backup Performance

Create 1000+ documents and test:

```javascript
async function stressTest() {
  const userId = 'admin-user';
  
  console.time('BackupCreation');
  const backup = await createBackup(userId, 'Manual');
  console.timeEnd('BackupCreation');
  
  console.log('Backup size:', formatBytes(backup.fileSize));
  console.log('Documents backed up:', backup.metadata.documentCount);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

stressTest();
```

**Expected**: Backup completes in reasonable time.

## Error Handling Testing

### Test 14: Test Error Scenarios

```javascript
// Test 1: Invalid document ID
await getDocument('students', 'invalid-id'); // Should return null

// Test 2: Invalid collection
try {
  await addDocument('nonexistent', { test: 'data' });
} catch (error) {
  console.log('Expected error:', error.message);
}

// Test 3: Firestore offline
// (Disconnect internet and test)
```

## Security Testing

### Test 15: Admin-Only Access

1. Sign in as non-admin user
2. Try to access Admin Backup Center
   - [ ] Should show "Access Denied" message
   - [ ] Cannot click backup buttons

3. Sign in as admin user
   - [ ] Can access Admin Backup Center
   - [ ] Can perform backup operations

### Test 16: Audit Trail

1. Perform various operations
2. Check audit logs:
   - [ ] All actions logged
   - [ ] Timestamps correct
   - [ ] User IDs recorded
   - [ ] Status shows Success/Failure

## Browser DevTools Debugging

### Check Firestore Data

1. Open DevTools
2. Go to Application → Firestore (if Firebase DevTools extension installed)
3. Verify collections:
   - [ ] students
   - [ ] fees
   - [ ] backups
   - [ ] auditLogs
   - [ ] users

### Check Network Requests

1. Open DevTools → Network tab
2. Perform a backup
3. Should see:
   - [ ] Firestore API calls (write operations)
   - [ ] Google Drive API calls (upload)
   - [ ] No 404 or 500 errors

### Check Console Logs

1. Open DevTools → Console tab
2. Watch for:
   - [ ] "Backing up collection: students" messages
   - [ ] "Uploading backup to Google Drive..." messages
   - [ ] No error messages (unless intentional test)

## Troubleshooting Guide

| Issue | Cause | Solution |
|-------|-------|----------|
| "Cannot connect to Firestore" | Wrong credentials or Firestore not enabled | Verify credentials in `.env.local`, enable Firestore in Firebase Console |
| "Permission denied" | User not admin or security rules blocking | Check user role, review Firestore security rules |
| "Google Drive upload fails" | API not enabled or wrong credentials | Verify Google Drive API enabled, check credentials |
| "Backup completes but no file in Drive" | fileId not saved or upload failed | Check network requests, verify folder ID |
| "Restore overwrites nothing" | Backup data corrupted or empty | Verify backup JSON structure, check document counts |

## Test Completion Checklist

- [ ] All Firestore CRUD operations work
- [ ] Backup creation succeeds
- [ ] Backups upload to Google Drive
- [ ] Restore from backup works
- [ ] Audit logs record all operations
- [ ] Admin-only access enforced
- [ ] Error handling working
- [ ] UI components display correctly
- [ ] Performance acceptable
- [ ] No console errors

## Next Steps

Once all tests pass:

1. Deploy to production
2. Enable automatic backups
3. Monitor backup performance
4. Review audit logs regularly
5. Plan backup retention policy
