# Firebase & Google Drive Configuration

## Environment Variables

Create a `.env` file in the project root with the following variables:

```
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Google Drive Configuration
VITE_GOOGLE_API_KEY=your-google-api-key
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_GOOGLE_DRIVE_FOLDER_ID=your-backup-folder-id

# Firebase Emulator (for development)
VITE_USE_FIREBASE_EMULATOR=false
```

## Setup Instructions

### 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Firestore Database:
   - Go to "Firestore Database" in the left menu
   - Click "Create Database"
   - Start in "Test Mode"
4. Enable Authentication:
   - Go to "Authentication" in the left menu
   - Click "Get Started"
   - Enable "Email/Password" provider
5. Get your Firebase credentials:
   - Go to "Project Settings" (gear icon)
   - Click "Your apps" and select your web app
   - Copy the config object

### 2. Google Drive API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Drive API:
   - Search for "Google Drive API"
   - Click "Enable"
4. Create OAuth 2.0 credentials:
   - Go to "Credentials" in the left menu
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Select "Web Application"
   - Add authorized redirect URIs:
     - `http://localhost:5173`
     - `http://localhost:5174`
     - Your production domain
   - Copy the Client ID and API Key
5. Create a backup folder on Google Drive:
   - Create a new folder named "AcadFlow Backups"
   - Get the folder ID from the URL

### 3. Firestore Security Rules

Set up these Firestore security rules to restrict backup operations to admins only:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Allow authenticated users to read their own data
    match /students/{document=**} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN';
    }
    
    // Restrict backups to ADMIN only
    match /backups/{document=**} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN';
      allow create: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN';
      allow delete: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN';
    }
    
    // Audit logs - read for admins, write to own logs
    match /auditLogs/{document=**} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN';
      allow create: if request.auth != null;
    }
    
    // Default deny
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 4. Required npm Packages

Once you have disk space, install:

```bash
npm install firebase
```

### 5. Collections Setup

The following Firestore collections will be created automatically:

- `students` - Student records
- `fees` - Fee payment records
- `attendance` - Attendance tracking
- `academicRecords` - Exam results and grades
- `users` - User accounts and roles
- `batches` - Student cohorts/batches
- `settings` - Application settings
- `backups` - Backup metadata
- `auditLogs` - Audit trail

### 6. Integration in App.jsx

Add the Backup Center to your sidebar menu:

```jsx
import AdminBackupCenter from './views/AdminBackupCenter';

// In your sidebar menu:
{user?.role === 'ADMIN' && (
  <button
    onClick={() => setCurrentView('backup')}
    className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 w-full"
  >
    <Database size={20} />
    Backup Center
  </button>
)}

// In your main view switcher:
{currentView === 'backup' && <AdminBackupCenter />}
```

## Firestore Data Structures

### Backup Metadata Document
```json
{
  "id": "backup_1234567890",
  "fileId": "google-drive-file-id",
  "fileName": "acadflow_backup_2024-06-04_1234567890.json",
  "backupDate": "2024-06-04T10:30:00Z",
  "fileSize": 2500000,
  "backupType": "Manual|Automatic",
  "createdBy": "user-id",
  "metadata": {
    "collectionsIncluded": ["students", "fees", "attendance", ...],
    "documentCount": 5000,
    "totalSize": 2500000
  },
  "status": "Completed|Failed|Pending",
  "errorMessage": null
}
```

### Audit Log Document
```json
{
  "id": "audit-log-id",
  "userId": "user-id",
  "action": "BACKUP_COMPLETED",
  "collection": null,
  "documentId": null,
  "status": "Success|Failure",
  "details": "Backup description",
  "changes": null,
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "timestamp": "2024-06-04T10:30:00Z"
}
```

## Automatic Weekly Backups

The system includes automatic weekly backup scheduling:

1. Navigate to Admin Backup Center
2. Click "Schedule Backup"
3. Select day of week and time
4. Enable "Automatic backups"

The backup will run automatically at the scheduled time using Cloud Functions or a service worker.

## Troubleshooting

### Google Drive Upload Fails
- Ensure Google Drive API is enabled
- Check that credentials are correct
- Verify backup folder ID exists
- Check browser console for detailed errors

### Firestore Connection Issues
- Verify Firebase credentials in `.env`
- Check Firestore security rules
- Enable Firestore in Firebase Console
- Check browser network tab for errors

### Large Backup Issues
- Firestore has document size limits (1 MB per document)
- Split large collections into subcollections if needed
- Consider archiving old data

## Security Considerations

1. **Admin-Only Access**: All backup operations require ADMIN role
2. **Audit Logging**: All backup actions are logged for compliance
3. **Encryption**: Consider enabling Google Drive encryption
4. **Retention**: Implement automatic cleanup of old backups
5. **Access Control**: Use Firestore security rules to restrict data access
