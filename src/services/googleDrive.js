/**
 * Google Drive API Integration
 * 
 * This service handles uploading backups to Google Drive and managing files
 * 
 * Prerequisites:
 * 1. Create a Google Cloud Project
 * 2. Enable Google Drive API
 * 3. Create OAuth 2.0 credentials (Web application)
 * 4. Set authorized redirect URIs
 */

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const GOOGLE_DRIVE_FOLDER_ID = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID || '';

let gapiInitialized = false;
let gisInitialized = false;

/**
 * Initialize Google API Client
 */
export async function initializeGoogleAPI() {
  return new Promise((resolve, reject) => {
    if (gapiInitialized) {
      resolve();
      return;
    }

    // Load Google API script
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            apiKey: GOOGLE_API_KEY,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
          });
          gapiInitialized = true;
          resolve();
        } catch (error) {
          console.error('Error initializing Google API:', error);
          reject(error);
        }
      });
    };
    script.onerror = () => reject(new Error('Failed to load Google API script'));
    document.head.appendChild(script);
  });
}

/**
 * Initialize Google Identity Services (for OAuth)
 */
export async function initializeGoogleIdentity() {
  return new Promise((resolve, reject) => {
    if (gisInitialized) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback
      });
      gisInitialized = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
}

/**
 * Get Google Drive authentication token
 */
export async function getGoogleDriveAuthToken() {
  try {
    await initializeGoogleAPI();
    
    // Try to get existing token
    const auth = window.gapi.auth2.getAuthInstance();
    if (auth && auth.isSignedIn.get()) {
      const user = auth.currentUser.get();
      return user.getAuthResponse().id_token;
    }

    // Prompt user to sign in
    return await new Promise((resolve, reject) => {
      window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: (response) => {
          if (response.access_token) {
            resolve(response.access_token);
          } else {
            reject(new Error('Failed to get access token'));
          }
        }
      }).requestAccessToken();
    });
  } catch (error) {
    console.error('Error getting Google Drive auth token:', error);
    throw error;
  }
}

/**
 * Upload backup file to Google Drive
 * @param {Blob} fileBlob - File blob to upload
 * @param {string} fileName - Name for the file
 * @returns {Promise<string>} - File ID
 */
export async function uploadBackupToGoogleDrive(fileBlob, fileName) {
  try {
    const token = await getGoogleDriveAuthToken();
    
    const metadata = {
      name: fileName,
      mimeType: 'application/json',
      parents: [GOOGLE_DRIVE_FOLDER_ID]
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', fileBlob);

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: form
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.id;
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    throw error;
  }
}

/**
 * Download backup file from Google Drive
 * @param {string} fileId - Google Drive file ID
 * @returns {Promise<string>} - File content as JSON string
 */
export async function downloadBackupFromGoogleDrive(fileId) {
  try {
    const token = await getGoogleDriveAuthToken();

    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    return await response.text();
  } catch (error) {
    console.error('Error downloading from Google Drive:', error);
    throw error;
  }
}

/**
 * Delete backup file from Google Drive
 * @param {string} fileId - Google Drive file ID
 */
export async function deleteBackupFromGoogleDrive(fileId) {
  try {
    const token = await getGoogleDriveAuthToken();

    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error deleting from Google Drive:', error);
    throw error;
  }
}

/**
 * List backup files from Google Drive folder
 * @returns {Promise<Array>} - Array of files
 */
export async function listBackupsFromGoogleDrive() {
  try {
    const token = await getGoogleDriveAuthToken();

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=parents='${GOOGLE_DRIVE_FOLDER_ID}'&spaces=drive&fields=files(id,name,createdTime,size)&orderBy=createdTime%20desc`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`List failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.files || [];
  } catch (error) {
    console.error('Error listing backups from Google Drive:', error);
    throw error;
  }
}

/**
 * Get file metadata from Google Drive
 * @param {string} fileId - Google Drive file ID
 * @returns {Promise<Object>} - File metadata
 */
export async function getGoogleDriveFileMetadata(fileId) {
  try {
    const token = await getGoogleDriveAuthToken();

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=*`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Metadata fetch failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting Google Drive file metadata:', error);
    throw error;
  }
}

/**
 * Handle Google OAuth callback
 */
function handleGoogleCallback(response) {
  // This is called automatically by Google when user signs in
  console.log('Google sign-in successful');
}

/**
 * Check Google Drive connectivity
 * @returns {Promise<boolean>} - True if can connect
 */
export async function checkGoogleDriveConnectivity() {
  try {
    const token = await getGoogleDriveAuthToken();
    
    const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.ok;
  } catch (error) {
    console.error('Google Drive connectivity check failed:', error);
    return false;
  }
}
