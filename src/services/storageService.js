// Academia Flow ERP - Cloud Storage Service
import { ref, uploadString, listAll, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../config/firebase";

/**
 * Uploads a JSON backup payload to Firebase Cloud Storage.
 * @param {Object} backupData - The full JSON object containing local storage data.
 * @param {string} fileName - The name to save the file as.
 * @returns {Promise<string>} - The download URL of the uploaded file.
 */
export const uploadCloudBackup = async (backupData, fileName) => {
  if (!storage) {
    throw new Error('Firebase Storage is not initialized.');
  }

  const jsonString = JSON.stringify(backupData, null, 2);
  const fileRef = ref(storage, `backups/${fileName}`);

  try {
    await uploadString(fileRef, jsonString, 'raw', {
      contentType: 'application/json',
    });
    const url = await getDownloadURL(fileRef);
    return url;
  } catch (error) {
    console.error("Error uploading backup:", error);
    throw new Error("Failed to upload backup to cloud storage: " + error.message);
  }
};

/**
 * Retrieves a list of all backup files stored in the cloud.
 * @returns {Promise<Array>} - Array of file objects containing name and url.
 */
export const listCloudBackups = async () => {
  if (!storage) {
    throw new Error('Firebase Storage is not initialized.');
  }

  const listRef = ref(storage, 'backups/');
  
  try {
    const res = await listAll(listRef);
    const backups = await Promise.all(res.items.map(async (itemRef) => {
      const url = await getDownloadURL(itemRef);
      return {
        name: itemRef.name,
        fullPath: itemRef.fullPath,
        url,
      };
    }));
    
    // Sort descending (newest first based on naming convention YYYY-MM-DDTHH-mm-ss)
    return backups.sort((a, b) => b.name.localeCompare(a.name));
  } catch (error) {
    console.error("Error listing backups:", error);
    throw new Error("Failed to retrieve cloud backups: " + error.message);
  }
};

/**
 * Downloads a cloud backup file payload.
 * @param {string} url - The download URL of the backup file.
 * @returns {Promise<Object>} - The JSON data payload.
 */
export const downloadCloudBackup = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error downloading backup:", error);
    throw new Error("Failed to download cloud backup: " + error.message);
  }
};

/**
 * Deletes a backup file from the cloud.
 * @param {string} fullPath - The full path of the file in storage.
 */
export const deleteCloudBackup = async (fullPath) => {
  if (!storage) {
    throw new Error('Firebase Storage is not initialized.');
  }

  const fileRef = ref(storage, fullPath);
  try {
    await deleteObject(fileRef);
  } catch (error) {
    console.error("Error deleting backup:", error);
    throw new Error("Failed to delete cloud backup: " + error.message);
  }
};
