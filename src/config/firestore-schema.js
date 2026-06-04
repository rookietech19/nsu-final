import { collection } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Firestore Collection References and Schema Definitions
 * 
 * These collections structure the data for Academia Flow ERP system
 */

// Collection References
export const collectionsRef = {
  students: collection(db, 'students'),
  fees: collection(db, 'fees'),
  attendance: collection(db, 'attendance'),
  academicRecords: collection(db, 'academicRecords'),
  users: collection(db, 'users'),
  batches: collection(db, 'batches'),
  settings: collection(db, 'settings'),
  backups: collection(db, 'backups'),
  auditLogs: collection(db, 'auditLogs')
};

/**
 * Firestore Schema Definitions
 * These are TypeScript-style JSDoc annotations for IDE support
 */

/**
 * @typedef {Object} Student
 * @property {string} id - Student ID (auto-generated)
 * @property {string} name - Full name
 * @property {string} email - Email address
 * @property {string} phone - Phone number
 * @property {string} dateOfBirth - Date of birth (ISO 8601)
 * @property {string} gender - Male/Female/Other
 * @property {string} passportNumber - Passport/ID number
 * @property {string} batchId - Reference to batch
 * @property {string} status - Active/Inactive/Graduated
 * @property {number} enrollmentYear - Year of enrollment
 * @property {Object} guardianInfo - Guardian contact information
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} Fee
 * @property {string} id - Fee record ID (auto-generated)
 * @property {string} studentId - Reference to student
 * @property {number} totalFees - Total fees amount
 * @property {number} paidFees - Amount already paid
 * @property {number} cashbackPaid - Cashback amount paid
 * @property {string} status - Pending/Partially Paid/Fully Paid
 * @property {Date} dueDate - Due date for payment
 * @property {Array<Object>} payments - Array of payment records
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} Attendance
 * @property {string} id - Attendance record ID (auto-generated)
 * @property {string} studentId - Reference to student
 * @property {string} batchId - Reference to batch
 * @property {Date} attendanceDate - Date of attendance
 * @property {string} status - Present/Absent/Leave/Late
 * @property {string} subject - Subject taught
 * @property {string} remarks - Additional remarks
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} AcademicRecord
 * @property {string} id - Record ID (auto-generated)
 * @property {string} studentId - Reference to student
 * @property {string} examName - Name of examination
 * @property {number} marksObtained - Marks obtained
 * @property {number} totalMarks - Total marks
 * @property {number} percentage - Percentage score
 * @property {string} grade - Grade (A, B, C, etc.)
 * @property {string} semester - Semester number
 * @property {Date} examDate - Date of exam
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} User
 * @property {string} id - User ID (matches Firebase Auth UID)
 * @property {string} name - Full name
 * @property {string} email - Email address
 * @property {string} role - Admin/Faculty/Staff/Student
 * @property {boolean} isActive - Whether account is active
 * @property {Date} lastLogin - Last login timestamp
 * @property {Object} permissions - Role-based permissions
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} Batch
 * @property {string} id - Batch ID (auto-generated)
 * @property {string} name - Batch name (e.g., "MBBS Cohort 2024-2029")
 * @property {string} academicYear - Academic year
 * @property {number} currentSemester - Current semester number
 * @property {string} description - Batch description
 * @property {number} totalStudents - Total students in batch
 * @property {Date} startDate - Start date
 * @property {Date} endDate - Expected end date
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} Settings
 * @property {string} id - Settings document ID
 * @property {string} institutionName - Institution name
 * @property {string} institutionAddress - Institution address
 * @property {string} institutionPhone - Institution phone
 * @property {string} institutionEmail - Institution email
 * @property {Object} backupSettings - Backup configuration
 * @property {string} googleDriveFolderId - Google Drive folder ID for backups
 * @property {Object} emailSettings - Email notification settings
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} Backup
 * @property {string} id - Backup ID (auto-generated)
 * @property {string} fileId - Google Drive file ID
 * @property {string} fileName - Name of backup file
 * @property {Date} backupDate - When backup was created
 * @property {number} fileSize - Size in bytes
 * @property {string} backupType - Manual/Automatic
 * @property {string} createdBy - User ID who initiated backup
 * @property {Object} metadata - Additional metadata
 * @property {Array<string>} collectionsIncluded - List of collections backed up
 * @property {string} status - Completed/Failed/Pending
 * @property {string} errorMessage - Error message if failed
 * @property {Date} createdAt - Creation timestamp
 */

/**
 * @typedef {Object} AuditLog
 * @property {string} id - Log ID (auto-generated)
 * @property {string} userId - User ID performing action
 * @property {string} action - Action performed (backup, restore, delete, etc.)
 * @property {string} collection - Collection affected
 * @property {string} documentId - Document ID if applicable
 * @property {string} status - Success/Failure
 * @property {string} details - Detailed description
 * @property {string} ipAddress - User's IP address
 * @property {Date} createdAt - When action was performed
 */

export const COLLECTIONS = {
  STUDENTS: 'students',
  FEES: 'fees',
  ATTENDANCE: 'attendance',
  ACADEMIC_RECORDS: 'academicRecords',
  USERS: 'users',
  BATCHES: 'batches',
  SETTINGS: 'settings',
  BACKUPS: 'backups',
  AUDIT_LOGS: 'auditLogs'
};

export const COLLECTION_LIST = [
  'students',
  'fees',
  'attendance',
  'academicRecords',
  'users',
  'batches',
  'settings'
];

export const BACKUP_COLLECTION_LIST = [
  'students',
  'fees',
  'attendance',
  'academicRecords',
  'users',
  'batches',
  'settings'
];
