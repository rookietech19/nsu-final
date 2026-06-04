# Firebase & Backup API Quick Reference

## Firestore CRUD Operations

### Create Document
```javascript
import { addDocument } from '@/services/firestore';

const docId = await addDocument('students', {
  name: 'John Doe',
  email: 'john@example.com',
  status: 'Active'
});
// Returns: string (document ID)
```

### Read Document
```javascript
import { getDocument } from '@/services/firestore';

const doc = await getDocument('students', 'docId');
// Returns: { id, ...data } or null
```

### Read All Documents
```javascript
import { getAllDocuments } from '@/services/firestore';

const docs = await getAllDocuments('students');
// Returns: [{ id, ...data }, ...]
```

### Query Documents
```javascript
import { queryByField, queryDocuments } from '@/services/firestore';
import { where, orderBy, limit } from 'firebase/firestore';

// Simple query by field
const docs = await queryByField('students', 'status', 'Active');

// Complex query
const docs = await queryDocuments('students', [
  where('status', '==', 'Active'),
  orderBy('name', 'asc'),
  limit(10)
]);
// Returns: [{ id, ...data }, ...]
```

### Update Document
```javascript
import { updateDocument } from '@/services/firestore';

await updateDocument('students', 'docId', {
  status: 'Inactive',
  // updatedAt added automatically
});
```

### Delete Document
```javascript
import { deleteDocument } from '@/services/firestore';

await deleteDocument('students', 'docId');
```

### Batch Operations
```javascript
import { batchWrite } from '@/services/firestore';

await batchWrite([
  {
    type: 'set',
    collection: 'students',
    docId: 'student1',
    data: { name: 'Alice' }
  },
  {
    type: 'update',
    collection: 'fees',
    docId: 'fee1',
    data: { paidFees: 5000 }
  },
  {
    type: 'delete',
    collection: 'students',
    docId: 'student2'
  }
]);
```

## Backup Operations

### Create Backup
```javascript
import { createBackup } from '@/services/backup';

const backup = await createBackup('user-id', 'Manual');
// Returns: {
//   id, fileId, fileName, backupDate, fileSize,
//   backupType, createdBy, metadata, status
// }
```

### Get Backup History
```javascript
import { getBackupHistory } from '@/services/backup';

const backups = await getBackupHistory(50);
// Returns: [{ ...backup }, ...]
```

### Restore from Backup
```javascript
import { restoreFromBackup } from '@/services/backup';

const result = await restoreFromBackup('backup-id', 'user-id');
// Returns: { success, restoredCount, errors[] }
```

### Download Backup
```javascript
import { downloadBackupAsFile } from '@/services/backup';

downloadBackupAsFile('backup-id', backupData);
// Downloads JSON file to browser
```

### Delete Old Backups
```javascript
import { deleteOldBackups } from '@/services/backup';

const deletedCount = await deleteOldBackups('user-id', 10);
// Keeps 10 recent backups, deletes older ones
```

### Schedule Weekly Backup
```javascript
import { scheduleWeeklyBackup } from '@/services/backup';

// Sunday (0) at 02:00 AM
await scheduleWeeklyBackup('user-id', 0, '02:00');
```

## Audit Logging

### Log Custom Event
```javascript
import { logAuditEvent } from '@/services/auditLog';

await logAuditEvent({
  userId: 'user-id',
  action: 'CUSTOM_ACTION',
  status: 'Success',
  details: 'What happened'
});
```

### Get Audit Logs
```javascript
import { getAllAuditLogs, getUserAuditLogs, getActionAuditLogs } from '@/services/auditLog';

// All logs
const allLogs = await getAllAuditLogs(100);

// User's logs
const userLogs = await getUserAuditLogs('user-id', 50);

// Specific action
const actionLogs = await getActionAuditLogs('BACKUP_COMPLETED', 100);
```

### Export Audit Logs
```javascript
import { exportAuditLogsAsCSV } from '@/services/auditLog';

await exportAuditLogsAsCSV(logs);
// Downloads CSV file
```

## Authentication

### Sign In
```javascript
import { signInUser } from '@/services/auth';

const user = await signInUser('user@example.com', 'password');
// Returns: { id, email, name, role, permissions, ... }
```

### Sign Out
```javascript
import { signOutUser } from '@/services/auth';

await signOutUser();
```

### Get Current User
```javascript
import { getCurrentUser } from '@/services/auth';

const user = await getCurrentUser();
// Returns: user object or null
```

### Create User
```javascript
import { createUserAccount } from '@/services/auth';

const user = await createUserAccount('user@example.com', 'password', {
  name: 'John Doe',
  role: 'ADMIN'
});
```

### Update User Role
```javascript
import { updateUserRole } from '@/services/auth';

await updateUserRole('user-id', 'Faculty');
```

### Check Permission
```javascript
import { hasPermission, isAdmin } from '@/services/auth';

if (hasPermission(user, 'canCreateBackup')) {
  // User can create backup
}

if (isAdmin(user)) {
  // User is admin
}
```

## Google Drive

### Upload Backup
```javascript
import { uploadBackupToGoogleDrive } from '@/services/googleDrive';

const fileId = await uploadBackupToGoogleDrive(blob, 'backup_name.json');
// Returns: string (Google Drive file ID)
```

### Download Backup
```javascript
import { downloadBackupFromGoogleDrive } from '@/services/googleDrive';

const content = await downloadBackupFromGoogleDrive('file-id');
// Returns: JSON string
```

### List Backups on Drive
```javascript
import { listBackupsFromGoogleDrive } from '@/services/googleDrive';

const files = await listBackupsFromGoogleDrive();
// Returns: [{ id, name, createdTime, size }, ...]
```

### Check Google Drive Connection
```javascript
import { checkGoogleDriveConnectivity } from '@/services/googleDrive';

const isConnected = await checkGoogleDriveConnectivity();
// Returns: boolean
```

## Data Migration

### Migrate from Base44
```javascript
import { migrateFromBase44ToFirestore } from '@/services/migration';
import base44 from '@base44/sdk';

const results = await migrateFromBase44ToFirestore(base44);
// Returns: {
//   success, collections: {}, errors: [], totalDocuments
// }
```

### Validate Migration
```javascript
import { validateMigration } from '@/services/migration';

const validation = await validateMigration(base44);
// Returns: { valid, collections: {}, mismatches: [] }
```

### Rollback Migration
```javascript
import { rollbackMigration } from '@/services/migration';

const results = await rollbackMigration();
// WARNING: Deletes all data from Firestore!
```

## Backup Scheduler

### Initialize Scheduler
```javascript
import { initializeBackupScheduler } from '@/services/backupScheduler';

// Check for scheduled backup every hour
initializeBackupScheduler('admin-user-id');
```

### Stop Scheduler
```javascript
import { stopBackupScheduler } from '@/services/backupScheduler';

stopBackupScheduler();
```

### Get Next Backup Time
```javascript
import { getNextScheduledBackupTime } from '@/services/backupScheduler';

const nextTime = await getNextScheduledBackupTime();
// Returns: Date or null
```

### Force Immediate Backup
```javascript
import { forceImmediateBackup } from '@/services/backupScheduler';

const backup = await forceImmediateBackup('admin-user-id');
```

## Hooks

### useBackupScheduler
```javascript
import { useBackupScheduler } from '@/hooks/useBackup';

function MyComponent() {
  const { isRunning } = useBackupScheduler(userId, true);
  
  return isRunning ? <p>Scheduler running</p> : <p>Scheduler stopped</p>;
}
```

### useBackupHistory
```javascript
import { useBackupHistory } from '@/hooks/useBackup';

function BackupList() {
  const { backups, loading, error, refetch } = useBackupHistory(50);
  
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  
  return (
    <div>
      {backups.map(b => <div key={b.id}>{b.fileName}</div>)}
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

### useAuditLogs
```javascript
import { useAuditLogs } from '@/hooks/useBackup';

function AuditList() {
  const { logs, loading, error, refetch } = useAuditLogs(100);
  
  return (
    <div>
      {logs.map(log => <LogEntry key={log.id} log={log} />)}
    </div>
  );
}
```

## Firestore Collections Schema

```javascript
// students
{
  id, name, email, phone, dateOfBirth, gender, passportNumber,
  batchId, status, enrollmentYear, guardianInfo,
  createdAt, updatedAt
}

// fees
{
  id, studentId, totalFees, paidFees, cashbackPaid,
  status, dueDate, payments, createdAt, updatedAt
}

// attendance
{
  id, studentId, batchId, attendanceDate, status,
  subject, remarks, createdAt, updatedAt
}

// academicRecords
{
  id, studentId, examName, marksObtained, totalMarks,
  percentage, grade, semester, examDate, createdAt, updatedAt
}

// users
{
  id, name, email, role, isActive, lastLogin,
  permissions, createdAt, updatedAt
}

// batches
{
  id, name, academicYear, currentSemester, description,
  totalStudents, startDate, endDate, createdAt, updatedAt
}

// backups
{
  id, fileId, fileName, backupDate, fileSize, backupType,
  createdBy, metadata, collectionsIncluded, status, errorMessage
}

// auditLogs
{
  id, userId, action, collection, documentId, status,
  details, changes, ipAddress, userAgent, createdAt
}
```

## Error Handling Pattern

```javascript
try {
  const result = await createBackup(userId, 'Manual');
  console.log('Success:', result);
} catch (error) {
  if (error.code === 'permission-denied') {
    console.error('Permission denied');
  } else if (error.code === 'not-found') {
    console.error('Resource not found');
  } else {
    console.error('Unknown error:', error.message);
  }
}
```

## Common Patterns

### Loading State Pattern
```javascript
const [loading, setLoading] = useState(false);

async function handleAction() {
  try {
    setLoading(true);
    const result = await firebaseOperation();
    showNotification('success', 'Operation completed');
  } catch (error) {
    showNotification('error', error.message);
  } finally {
    setLoading(false);
  }
}
```

### Form Submission Pattern
```javascript
async function handleSubmit(formData) {
  if (!formData.name || !formData.email) {
    showNotification('error', 'Fill all fields');
    return;
  }
  
  try {
    const docId = await addDocument('students', formData);
    showNotification('success', 'Student added');
    onSuccess(docId);
  } catch (error) {
    showNotification('error', error.message);
  }
}
```

## Performance Tips

1. Use batch operations for multiple documents
2. Index frequently queried fields
3. Limit query results with `limit()`
4. Cache data in component state when possible
5. Use `useCallback` to prevent unnecessary re-renders
6. Consider pagination for large result sets

## Security Best Practices

1. Always check user role before admin operations
2. Use Firestore security rules for backend enforcement
3. Sanitize user input before storing
4. Don't store sensitive data in Firestore
5. Log all critical operations in audit trail
6. Use HTTPS for all API calls
