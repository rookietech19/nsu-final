# Updated Dependencies Required

After freeing up disk space, install these packages:

## Core Firebase

```bash
npm install firebase
```

This provides:
- `firebase/app` - Firebase App initialization
- `firebase/auth` - Authentication
- `firebase/firestore` - Firestore Database
- `firebase/storage` - Cloud Storage

## Your Updated package.json

Add the firebase dependency:

```json
{
  "name": "acadflow",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@base44/sdk": "^0.8.31",
    "firebase": "^10.7.1",
    "lucide-react": "^1.17.0",
    "react": "^19.2.6",
    "react-dom": "^19.2.6"
  },
  "devDependencies": {
    "@eslint/js": "^10.0.1",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.1",
    "eslint": "^10.3.0",
    "eslint-plugin-react-hooks": "^7.1.1",
    "eslint-plugin-react-refresh": "^0.5.2",
    "globals": "^17.6.0",
    "vite": "^8.0.12"
  }
}
```

## Installation Steps

1. **Free up disk space** on your C: drive
   - Delete temporary files
   - Clear npm cache: `npm cache clean --force`
   - Uninstall unused programs

2. **Check available space**
   ```bash
   Get-Volume -DriveLetter C
   ```

3. **Install Firebase**
   ```bash
   npm install firebase
   ```

4. **Create `.env.local`** with your credentials (from `.env.example`)

5. **Verify installation**
   ```bash
   npm list firebase
   ```

## Disk Space Estimate

- Firebase SDK: ~50 MB
- node_modules after Firebase: ~100 MB total additional

**Minimum required**: 200 MB free space

## After Installation

1. Update your `src/App.jsx` to initialize Firebase
2. Migrate data from base44 to Firestore
3. Test backup/restore functionality
4. Enable automatic backups

## Troubleshooting Installation

### npm ERR! code ENOSPC
- Disk is full
- Free up space or expand drive

### npm ERR! Error downloading npm packages
- Check internet connection
- Try: `npm install --no-save` to skip saving to package.json

### Module not found after installation
- Run: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json`
- Run: `npm install` again

## Verifying Firebase Works

After installation, test in browser console:

```javascript
import { app, db, auth } from './config/firebase.js';
console.log('Firebase app:', app);
console.log('Firestore db:', db);
console.log('Auth:', auth);
```

All three should show objects, not errors.
