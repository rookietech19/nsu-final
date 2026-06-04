import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Firestore Service - CRUD operations and batch operations
 */

// ============= CREATE OPERATIONS =============

/**
 * Add a new document to a collection
 * @param {string} collectionName - Collection name
 * @param {Object} data - Document data
 * @returns {Promise<string>} - Document ID
 */
export async function addDocument(collectionName, data) {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    throw error;
  }
}

// ============= READ OPERATIONS =============

/**
 * Get a single document by ID
 * @param {string} collectionName - Collection name
 * @param {string} docId - Document ID
 * @returns {Promise<Object|null>} - Document data or null
 */
export async function getDocument(collectionName, docId) {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Get all documents from a collection
 * @param {string} collectionName - Collection name
 * @returns {Promise<Array>} - Array of documents
 */
export async function getAllDocuments(collectionName) {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Query documents with conditions
 * @param {string} collectionName - Collection name
 * @param {Array} constraints - Query constraints (where, orderBy, limit)
 * @returns {Promise<Array>} - Array of documents
 */
export async function queryDocuments(collectionName, constraints = []) {
  try {
    const collectionRef = collection(db, collectionName);
    const q = query(collectionRef, ...constraints);
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error(`Error querying ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Query documents by field value
 * @param {string} collectionName - Collection name
 * @param {string} fieldName - Field to query
 * @param {*} fieldValue - Value to match
 * @returns {Promise<Array>} - Array of matching documents
 */
export async function queryByField(collectionName, fieldName, fieldValue) {
  try {
    const q = query(
      collection(db, collectionName),
      where(fieldName, '==', fieldValue)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error(`Error querying ${collectionName} by ${fieldName}:`, error);
    throw error;
  }
}

// ============= UPDATE OPERATIONS =============

/**
 * Update a document
 * @param {string} collectionName - Collection name
 * @param {string} docId - Document ID
 * @param {Object} data - Data to update
 * @returns {Promise<void>}
 */
export async function updateDocument(collectionName, docId, data) {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
}

// ============= DELETE OPERATIONS =============

/**
 * Delete a document
 * @param {string} collectionName - Collection name
 * @param {string} docId - Document ID
 * @returns {Promise<void>}
 */
export async function deleteDocument(collectionName, docId) {
  try {
    await deleteDoc(doc(db, collectionName, docId));
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
}

// ============= BATCH OPERATIONS =============

/**
 * Batch write operations
 * @param {Array<Object>} operations - Array of operations {type, collection, data, docId?}
 * @returns {Promise<void>}
 */
export async function batchWrite(operations) {
  try {
    const batch = writeBatch(db);
    
    operations.forEach(op => {
      if (op.type === 'set') {
        const docRef = doc(db, op.collection, op.docId);
        batch.set(docRef, {
          ...op.data,
          updatedAt: Timestamp.now()
        });
      } else if (op.type === 'update') {
        const docRef = doc(db, op.collection, op.docId);
        batch.update(docRef, {
          ...op.data,
          updatedAt: Timestamp.now()
        });
      } else if (op.type === 'delete') {
        const docRef = doc(db, op.collection, op.docId);
        batch.delete(docRef);
      }
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error in batch write:', error);
    throw error;
  }
}

/**
 * Get collection size for backup estimation
 * @param {string} collectionName - Collection name
 * @returns {Promise<number>} - Number of documents
 */
export async function getCollectionSize(collectionName) {
  try {
    const snapshot = await getDocs(collection(db, collectionName));
    return snapshot.size;
  } catch (error) {
    console.error(`Error getting collection size for ${collectionName}:`, error);
    throw error;
  }
}
