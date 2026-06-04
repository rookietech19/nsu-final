# Firebase Integration & Admin Backup Center - Implementation Guide

## Overview

This guide walks you through integrating Firebase Firestore as the primary database for Academia Flow ERP and implementing the comprehensive Admin Backup Center with automatic weekly backups and Google Drive integration.

## Architecture

### Component Structure

```
src/
├── config/
│   ├── firebase.js                 # Firebase initialization
│   └── firestore-schema.js         # Collection definitions & schemas
├── services/
│   ├── firestore.js               # CRUD operations
│   ├── backup.js                  # Backup/restore logic
│   ├── googleDrive.js             # Google Drive API integration
│   ├── auditLog.js                # Audit logging
│   ├── auth.js                    # Authentication & roles
│   └── migration.js               # Base44 → Firestore migration
├── views/
│   ├── AdminBackupCenter.jsx      # Backup management UI
│   └── AuditLogViewer.jsx         # Audit log viewer UI
└── context/
    ├── AuthContext.jsx            # User auth state (update needed)
    └── NotificationContext.jsx    # Toast notifications (exists)
```

## Step 1: Environment Setup

### 1.1 Create `.env.local` file

Copy from `.env.example` and fill in your credentials:

```bash
VITE_FIREBASE_API_KEY=AIzaSyD...
VITE_FIREBASE_AUTH_DOMAIN=acadflow-xxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=acadflow-xxxx
VITE_FIREBASE_STORAGE_BUCKET=acadflow-xxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

VITE_GOOGLE_API_KEY=AIzaSyD...
VITE_GOOGLE_CLIENT_ID=123456789...apps.googleusercontent.com
VITE_GOOGLE_DRIVE_FOLDER_ID=1aBcDefGhIjKlMn...
```

### 1.2 Update AuthContext.jsx

Modify `src/context/AuthContext.jsx` to use Firebase auth:

```jsx
import React, { createContext, useState, useEffect } from 'react';
import { getCurrentUser, signInUser, signOutUser } from '../services/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize Firebase auth
    const initAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signInUser, signOutUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
```

## Step 2: Install Dependencies

Once you free up disk space:

```bash
npm install firebase
```

## Step 3: Firebase Configuration

### 3.1 Set up Firestore Security Rules

In Firebase Console → Firestore → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Admin-only backup operations
    match /backups/{document=**} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN';
      allow create: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN';
      allow delete: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN';
    }
    
    // Audit logs - read for admins, write for any authenticated user
    match /auditLogs/{document=**} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN';
      allow create: if request.auth != null;
    }
    
    // Other collections - authenticated read/write
    match /students/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    match /fees/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    match /attendance/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    match /academicRecords/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    match /users/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == resource.id || 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN';
    }
    
    match /batches/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    match /settings/{document=**} {
      allow read: if request.auth != null;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN';
    }
  }
}
```

### 3.2 Create Google Drive API Integration

1. Set up OAuth credentials as described in `FIREBASE_SETUP.md`
2. Ensure `VITE_GOOGLE_DRIVE_FOLDER_ID` is set to your backup folder ID

## Step 4: Integrate with App.jsx

Update `src/App.jsx` to include the Backup Center:

```jsx
import AdminBackupCenter from './views/AdminBackupCenter';
import AuditLogViewer from './views/AuditLogViewer';
import { Database, Log } from 'lucide-react';

// In your sidebar (add to menu):
{user?.role === 'ADMIN' && (
  <>
    <button
      onClick={() => setCurrentView('backup')}
      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 w-full"
    >
      <Database size={20} />
      Backup Center
    </button>
    <button
      onClick={() => setCurrentView('auditLogs')}
      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 w-full"
    >
      <Log size={20} />
      Audit Logs
    </button>
  </>
)}

// In your view switcher:
{currentView === 'backup' && <AdminBackupCenter />}
{currentView === 'auditLogs' && <AuditLogViewer />}
```

## Step 5: Data Migration

### 5.1 Migrate from base44 to Firestore

```jsx
import { migrateFromBase44ToFirestore, validateMigration } from './services/migration';
import base44 from '@base44/sdk';

// Create a migration component or run in console
async function runMigration() {
  try {
    console.log('Starting migration...');
    const results = await migrateFromBase44ToFirestore(base44);
    
    console.log('Migration complete!', results);
    
    // Validate migration
    const validation = await validateMigration(base44);
    console.log('Validation:', validation);
    
    // Download report
    downloadMigrationReport(results);
  } catch (error) {
    console.error('Migration error:', error);
  }
}
```

### 5.2 Run Migration in Console

Open browser DevTools console and run:

```javascript
// Copy the migration function and run it
```

## Step 6: Backup & Restore Operations

### 6.1 Backup Now

Users click "Backup Now" button in Admin Backup Center:
- Creates backup of all collections
- Uploads to Google Drive
- Saves metadata to Firestore
- Logs action in audit trail

### 6.2 Schedule Automatic Backups

1. Click "Schedule Backup"
2. Select day of week and time
3. Enable automatic backups
4. System runs backup at scheduled time

### 6.3 Restore from Backup

1. Click restore icon next to backup
2. Confirm action (warning displayed)
3. System overwrites all data with backup
4. Logs restoration in audit trail

## Step 7: Audit Logging

All backup operations are automatically logged:

- User ID
- Action performed
- Timestamp
- Status (Success/Failure)
- IP address
- Error messages (if any)

View logs in "Audit Logs" section.

## File Structure Summary

| File | Purpose |
|------|---------|
| `src/config/firebase.js` | Firebase initialization |
| `src/config/firestore-schema.js` | Collection schema definitions |
| `src/services/firestore.js` | CRUD operations |
| `src/services/backup.js` | Backup/restore logic |
| `src/services/googleDrive.js` | Google Drive API |
| `src/services/auditLog.js` | Audit logging |
| `src/services/auth.js` | Authentication |
| `src/services/migration.js` | Data migration |
| `src/views/AdminBackupCenter.jsx` | Backup UI |
| `src/views/AuditLogViewer.jsx` | Audit logs UI |

## Features Implemented

✅ Firebase Firestore integration
✅ 7 main collections (students, fees, attendance, etc.)
✅ Complete CRUD operations via Firestore service
✅ Admin-only backup creation
✅ Backup restoration with confirmation
✅ Google Drive integration for backup storage
✅ Automatic weekly backup scheduling
✅ Backup metadata tracking
✅ Complete audit logging
✅ Responsive Tailwind UI
✅ Loading states and error handling
✅ Backup history viewer
✅ Download & restore capabilities
✅ CSV export for audit logs
✅ Admin role-based access control

## Security Features

✅ Admin-only access via Firestore security rules
✅ Role-based permission system
✅ Audit trail for all operations
✅ IP address logging
✅ Timestamp tracking
✅ Error logging for troubleshooting
✅ OAuth 2.0 for Google Drive access

## Troubleshooting

### Disk Space Issue
- Your C: drive is full (0 bytes remaining)
- Free up space before running `npm install`
- Delete temporary files, caches, old backups

### Firebase Connection Failed
- Check `.env.local` credentials
- Verify Firestore is enabled in Firebase Console
- Check security rules allow access
- Review browser console for specific errors

### Google Drive Upload Failed
- Verify API credentials in `.env.local`
- Check Google Drive folder ID exists
- Ensure Google Drive API is enabled
- Check OAuth scopes include `drive.file`

### Migration Issues
- Ensure base44 entities are properly loaded
- Check Firestore collections exist
- Review error messages in console
- Validate data integrity after migration

## Next Steps

1. Free up disk space on C: drive
2. Run `npm install firebase`
3. Set up Firebase project and get credentials
4. Create `.env.local` file with credentials
5. Update Firestore security rules
6. Integrate components into App.jsx
7. Run data migration from base44
8. Test backup creation and restore
9. Verify audit logging

## Support

For detailed setup instructions, see:
- `FIREBASE_SETUP.md` - Complete Firebase configuration guide
- Firebase Console documentation
- Google Drive API documentation
