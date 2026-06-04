// Academia Flow ERP - Base44 DB & Auth Client
import { createClient } from "@base44/sdk";

// Helper to generate UUIDs
const generateId = () => Math.random().toString(36).substring(2, 11) + '_' + Date.now();

// Simulated indexes for frequently queried fields
const INDEXED_FIELDS = {
  Student: ['roll_number', 'batch_id', 'status'],
  Attendance: ['student_id', 'date', 'status', 'batch_id'],
  Examination: ['student_id', 'semester', 'exam_name'],
  BehaviourRecord: ['student_id', 'date', 'type'],
  ExamSchedule: ['exam_date', 'college_id', 'batch_id'],
  Batch: ['college_id'],
  ClassType: ['name']
};

// Database Schema definitions for validation
const SCHEMA_VALIDATION = {
  College: {
    required: ['name'],
    types: { name: 'string', passing_marks: 'number', total_marks: 'number' }
  },
  Batch: {
    required: ['name', 'college_id'],
    types: { name: 'string', college_id: 'string' }
  },
  // New fee management schemas
  Fee: {
    required: ['student_id', 'total_fees'],
    types: { student_id: 'string', total_fees: 'number', paid_fees: 'number', cashback_paid: 'number' }
  },
  Payment: {
    required: ['student_id', 'amount', 'payment_method', 'payment_date'],
    types: { student_id: 'string', amount: 'number', payment_method: 'string', transaction_id: 'string', payment_date: 'string', notes: 'string' }
  },
  Cashback: {
    required: ['student_id', 'cashback_amount', 'status'],
    types: { student_id: 'string', cashback_amount: 'number', approved_by: 'string', status: 'string', date: 'string' }
  },
  Student: {
    required: ['full_name', 'roll_number', 'class_name'],
    types: { full_name: 'string', roll_number: 'string', email: 'string', status: 'string' }
  },
  Attendance: {
    required: ['student_id', 'date', 'status'],
    types: { student_id: 'string', date: 'string', status: 'string' }
  },
  Examination: {
    required: ['student_id', 'semester', 'exam_name', 'subject'],
    types: { student_id: 'string', semester: 'string', exam_name: 'string', subject: 'string', marks_obtained: 'number', max_marks: 'number' }
  },
  BehaviourRecord: {
    required: ['student_id', 'date', 'type', 'category', 'description'],
    types: { student_id: 'string', date: 'string', type: 'string', category: 'string', description: 'string' }
  },
  ClassType: {
    required: ['name', 'color'],
    types: { name: 'string', color: 'string' }
  },
  ExamSchedule: {
    required: ['exam_name', 'subject', 'exam_date'],
    types: { exam_name: 'string', subject: 'string', exam_date: 'string', total_marks: 'number' }
  }
};

// Relation check definitions (prevent deleting parents of records)
const RELATION_CONSTRAINTS = {
  College: [
    { targetEntity: 'Batch', foreignKey: 'college_id', message: 'Cannot delete college: It is referenced by active academic batches.' }
  ],
  Batch: [
    { targetEntity: 'Student', foreignKey: 'batch_id', message: 'Cannot delete batch: It contains active student enrollments.' },
    { targetEntity: 'ExamSchedule', foreignKey: 'batch_id', message: 'Cannot delete batch: There are exam timetables scheduled for this batch.' }
  ],
  // Fee management relations
  Fee: [
    { targetEntity: 'Student', foreignKey: 'student_id', message: 'Cannot delete fee record: Linked to a student.' }
  ],
  Payment: [
    { targetEntity: 'Student', foreignKey: 'student_id', message: 'Cannot delete payment: Linked to a student.' },
    { targetEntity: 'Fee', foreignKey: 'student_id', matchField: 'student_id', message: 'Cannot delete payment: Associated fee record exists.' }
  ],
  Cashback: [
    { targetEntity: 'Student', foreignKey: 'student_id', message: 'Cannot delete cashback: Linked to a student.' }
  ],
  Student: [
    { targetEntity: 'Attendance', foreignKey: 'student_id', message: 'Cannot delete student: Attendance records are registered under this student.' },
    { targetEntity: 'Examination', foreignKey: 'student_id', message: 'Cannot delete student: Examination marksheets exist for this student.' },
    { targetEntity: 'BehaviourRecord', foreignKey: 'student_id', message: 'Cannot delete student: Behavioral incidents are logged against this student.' }
  ],
  ClassType: [
    { targetEntity: 'Attendance', foreignKey: 'class_type', matchField: 'name', message: 'Cannot delete class type: There are attendance sessions marked with this type.' }
  ]
};

// local storage helper
const getStorageData = (key) => {
  const data = localStorage.getItem(`acadflow_${key}`);
  return data ? JSON.parse(data) : [];
};

const setStorageData = (key, data) => {
  localStorage.setItem(`acadflow_${key}`, JSON.stringify(data));
};

// Check if we are running in an environment with real Base44 app configurations
const isProduction = !!(import.meta.env.VITE_BASE44_APP_ID || window.__BASE44_APP_ID__);

class MockCollection {
  constructor(name) {
    this.name = name;
  }

  // Generate Audit log
  logAudit(action, recordId, oldData, newData) {
    const activeUser = JSON.parse(localStorage.getItem('acadflow_current_user') || 'null') || { email: 'system@acadflow.edu', name: 'System Seeder', role: 'admin' };
    const auditLogs = getStorageData('AuditTrail');
    const auditRecord = {
      id: 'aud_' + generateId(),
      entity: this.name,
      recordId,
      action,
      timestamp: new Date().toISOString(),
      userId: activeUser.email,
      userName: activeUser.name,
      userRole: activeUser.role,
      oldData: oldData ? JSON.parse(JSON.stringify(oldData)) : null,
      newData: newData ? JSON.parse(JSON.stringify(newData)) : null
    };
    auditLogs.unshift(auditRecord);
    setStorageData('AuditTrail', auditLogs);
  }

  async list() {
    console.log(`[DB READ] Listing all records for entity: ${this.name}`);
    return getStorageData(this.name);
  }

  async filter(query = {}) {
    const records = getStorageData(this.name);
    const queryKeys = Object.keys(query);
    
    // Index check
    const indexes = INDEXED_FIELDS[this.name] || [];
    const matchedIndexes = queryKeys.filter(key => indexes.includes(key));
    const unindexedFields = queryKeys.filter(key => !indexes.includes(key));
    
    if (queryKeys.length > 0) {
      if (matchedIndexes.length > 0) {
        console.log(`[DB INDEX] Querying ${this.name} using indexes: [${matchedIndexes.join(', ')}]. Index lookup: 0.04ms.`);
      }
      if (unindexedFields.length > 0) {
        console.warn(`[DB SCAN] Querying ${this.name} without index on: [${unindexedFields.join(', ')}]. Simulating full collection scan.`);
      }
    }

    return records.filter(item => {
      for (const key of queryKeys) {
        if (query[key] !== undefined && item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
  }

  async create(data) {
    // Validate inputs
    const rules = SCHEMA_VALIDATION[this.name];
    if (rules) {
      for (const req of rules.required) {
        if (data[req] === undefined || data[req] === null || data[req] === '') {
          throw new Error(`Validation Error: Field "${req}" is required for entity ${this.name}.`);
        }
      }
    }

    // Unique Student roll number check
    if (this.name === 'Student') {
      const allStudents = getStorageData('Student');
      const rollExists = allStudents.some(s => s.roll_number.toLowerCase() === data.roll_number.toLowerCase());
      if (rollExists) {
        throw new Error(`Conflict: Roll number "${data.roll_number}" is already assigned to another student.`);
      }
    }

    const records = getStorageData(this.name);
    const newRecord = {
      ...data,
      id: `${this.name.toLowerCase().substring(0,3)}_${generateId()}`,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    records.push(newRecord);
    setStorageData(this.name, records);
    this.logAudit('CREATE', newRecord.id, null, newRecord);

    console.log(`[DB WRITE] Created record in ${this.name} with ID ${newRecord.id}`);
    return newRecord;
  }

  async update(id, data) {
    const records = getStorageData(this.name);
    const index = records.findIndex(r => r.id === id);
    if (index === -1) {
      throw new Error(`Not Found: Record ${id} in entity ${this.name} does not exist.`);
    }

    const oldRecord = records[index];

    // Optimistic Concurrency check
    if (data.version !== undefined && oldRecord.version !== data.version) {
      throw new Error(`Concurrency Error: The record was modified by another user. Please refresh and try again.`);
    }

    const updatedRecord = {
      ...oldRecord,
      ...data,
      version: oldRecord.version + 1,
      updatedAt: new Date().toISOString()
    };

    records[index] = updatedRecord;
    setStorageData(this.name, records);
    this.logAudit('UPDATE', id, oldRecord, updatedRecord);

    console.log(`[DB WRITE] Updated record ${id} in ${this.name}`);
    return updatedRecord;
  }

  async delete(id) {
    const records = getStorageData(this.name);
    const index = records.findIndex(r => r.id === id);
    if (index === -1) {
      throw new Error(`Not Found: Record ${id} in entity ${this.name} does not exist.`);
    }

    const recordToDelete = records[index];

    // Relation constraints check
    const constraints = RELATION_CONSTRAINTS[this.name];
    if (constraints) {
      for (const rel of constraints) {
        const relatedRecords = getStorageData(rel.targetEntity);
        let exists = false;
        
        if (rel.matchField) {
          exists = relatedRecords.some(r => r[rel.foreignKey] === recordToDelete[rel.matchField]);
        } else {
          exists = relatedRecords.some(r => r[rel.foreignKey] === id);
        }

        if (exists) {
          throw new Error(`Relationship Conflict: ${rel.message}`);
        }
      }
    }

    const oldRecord = records[index];
    records.splice(index, 1);
    setStorageData(this.name, records);
    this.logAudit('DELETE', id, oldRecord, null);

    console.log(`[DB WRITE] Deleted record ${id} from ${this.name}`);
    return oldRecord;
  }
}

// Mock Auth service
const mockAuth = {
  me: async () => {
    const user = localStorage.getItem('acadflow_current_user');
    return user ? JSON.parse(user) : null;
  },
  loginViaProvider: async (provider) => {
    console.log(`[AUTH] Initiating Gmail OAuth via provider: ${provider}`);
    // Return standard mock teacher for immediate startup
    const mockUser = {
      email: 'dr.sarah.smith@acadflow.edu',
      name: 'Dr. Sarah Smith',
      role: 'admin', // Start as Admin for easy testing, can change roles
    };
    localStorage.setItem('acadflow_current_user', JSON.stringify(mockUser));
    
    // Ensure this user is registered in the user list
    const users = getStorageData('User');
    if (!users.some(u => u.email === mockUser.email)) {
      users.push({
        id: 'usr_' + generateId(),
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        createdAt: new Date().toISOString()
      });
      setStorageData('User', users);
    }
    return mockUser;
  },
  logout: async () => {
    console.log('[AUTH] Logging out user');
    localStorage.removeItem('acadflow_current_user');
    return true;
  }
};

// Initial Demo Seeding
export const seedDemoData = (force = false) => {
  if (!force && localStorage.getItem('acadflow_seeded') === 'true') {
    return;
  }

  console.log('[DB SEED] Seeding mock data for Academia Flow ERP...');

  // 1. College
  const college = {
    id: 'col_primary',
    name: 'Aegis Institute of Medical Sciences',
    faculty: 'Faculty of Clinical Medicine',
    phone: '+1 (555) 019-2834',
    email: 'info@aegis-med.edu',
    address: '450 University Ave, Suite 100, Medical District',
    logo_url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=120&h=120&q=80',
    dean_name: 'Dr. Arthur Pendelton, MD',
    dean_title: 'Dean of International Clinical Operations',
    passing_marks: 60,
    total_marks: 100,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  setStorageData('College', [college]);

  // 2. Class Types
  const classTypes = [
    { id: 'ct_1', name: 'Lecture', description: 'Theoretical instruction in main theatre', color: '#3b82f6', version: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'ct_2', name: 'Lab Practical', description: 'Hands-on laboratory experiments', color: '#10b981', version: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'ct_3', name: 'Ward Round', description: 'Clinical rounds in teaching hospital wards', color: '#8b5cf6', version: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'ct_4', name: 'Seminar', description: 'Interactive journal club and case discussions', color: '#f59e0b', version: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  ];
  setStorageData('ClassType', classTypes);

  // 3. Batches
  const batches = [
    {
      id: 'bat_mbbs_24',
      name: 'MBBS Cohort 2024-2029',
      college_id: 'col_primary',
      college_name: college.name,
      year: '2024-2029',
      semester: 'Semester 3',
      description: 'Second-year medical undergraduates focusing on Pathology and Microbiology.',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'bat_mbbs_25',
      name: 'MBBS Cohort 2025-2030',
      college_id: 'col_primary',
      college_name: college.name,
      year: '2025-2030',
      semester: 'Semester 1',
      description: 'First-year medical undergraduates focusing on Human Anatomy and Physiology.',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  setStorageData('Batch', batches);

  // 4. Students
  const students = [
    {
      id: 'stu_1',
      full_name: 'Anya Chen',
      roll_number: 'AIMS-2024-004',
      date_of_birth: '2004-03-12',
      gender: 'Female',
      phone: '+1 (555) 012-3456',
      email: 'anya.chen@student.aegis-med.edu',
      address: 'Dormitory Hall B, Room 204',
      photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80',
      class_name: 'MBBS-2A',
      department: 'Medicine',
      college_id: 'col_primary',
      college_name: college.name,
      batch_id: 'bat_mbbs_24',
      batch_name: 'MBBS Cohort 2024-2029',
      admission_date: '2024-08-15',
      status: 'Active',
      guardian_name: 'David Chen',
      guardian_phone: '+1 (555) 012-3457',
      passport_url: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&w=400&h=250&q=80',
      other_documents: [
        { name: 'Medical Clearance Certificate', url: '#' },
        { name: 'Visa Approval Letter', url: '#' }
      ],
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'stu_2',
      full_name: 'Marcus Vance',
      roll_number: 'AIMS-2024-089',
      date_of_birth: '2003-09-28',
      gender: 'Male',
      phone: '+1 (555) 014-9988',
      email: 'marcus.vance@student.aegis-med.edu',
      address: '12 Oak Ridge Rd, Metro City',
      photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
      class_name: 'MBBS-2A',
      department: 'Medicine',
      college_id: 'col_primary',
      college_name: college.name,
      batch_id: 'bat_mbbs_24',
      batch_name: 'MBBS Cohort 2024-2029',
      admission_date: '2024-08-15',
      status: 'Active',
      guardian_name: 'Helena Vance',
      guardian_phone: '+1 (555) 014-9989',
      passport_url: '',
      other_documents: [
        { name: 'Academic Transcript', url: '#' }
      ],
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'stu_3',
      full_name: 'Emily Watson',
      roll_number: 'AIMS-2025-015',
      date_of_birth: '2005-07-22',
      gender: 'Female',
      phone: '+1 (555) 017-4433',
      email: 'emily.watson@student.aegis-med.edu',
      address: 'Dormitory Hall A, Room 102',
      photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
      class_name: 'MBBS-1B',
      department: 'Medicine',
      college_id: 'col_primary',
      college_name: college.name,
      batch_id: 'bat_mbbs_25',
      batch_name: 'MBBS Cohort 2025-2030',
      admission_date: '2025-08-20',
      status: 'Active',
      guardian_name: 'Robert Watson',
      guardian_phone: '+1 (555) 017-4434',
      passport_url: '',
      other_documents: [],
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  setStorageData('Student', students);

  // 5. Attendance
  const attendance = [
    { id: 'att_1', student_id: 'stu_1', student_name: 'Anya Chen', class_name: 'MBBS-2A', college_id: 'col_primary', college_name: college.name, batch_id: 'bat_mbbs_24', batch_name: 'MBBS Cohort 2024-2029', date: '2026-06-03', status: 'Present', subject: 'Systemic Pathology', class_type: 'Lecture', period: 'Period 1 (08:00 - 09:30)', remarks: '', version: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'att_2', student_id: 'stu_2', student_name: 'Marcus Vance', class_name: 'MBBS-2A', college_id: 'col_primary', college_name: college.name, batch_id: 'bat_mbbs_24', batch_name: 'MBBS Cohort 2024-2029', date: '2026-06-03', status: 'Late', subject: 'Systemic Pathology', class_type: 'Lecture', period: 'Period 1 (08:00 - 09:30)', remarks: '15 min traffic delay', version: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'att_3', student_id: 'stu_1', student_name: 'Anya Chen', class_name: 'MBBS-2A', college_id: 'col_primary', college_name: college.name, batch_id: 'bat_mbbs_24', batch_name: 'MBBS Cohort 2024-2029', date: '2026-06-04', status: 'Present', subject: 'Pathology Lab', class_type: 'Lab Practical', period: 'Period 2 (10:00 - 12:00)', remarks: '', version: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'att_4', student_id: 'stu_2', student_name: 'Marcus Vance', class_name: 'MBBS-2A', college_id: 'col_primary', college_name: college.name, batch_id: 'bat_mbbs_24', batch_name: 'MBBS Cohort 2024-2029', date: '2026-06-04', status: 'Absent', subject: 'Pathology Lab', class_type: 'Lab Practical', period: 'Period 2 (10:00 - 12:00)', remarks: 'Unnotified', version: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  ];
  setStorageData('Attendance', attendance);

  // 6. Examination
  const examinations = [
    {
      id: 'exm_1',
      student_id: 'stu_1',
      student_name: 'Anya Chen',
      class_name: 'MBBS-2A',
      college_id: 'col_primary',
      college_name: college.name,
      batch_id: 'bat_mbbs_24',
      batch_name: 'MBBS Cohort 2024-2029',
      semester: 'Semester 3',
      exam_name: 'Mid-term evaluation',
      subject: 'Systemic Pathology',
      exam_date: '2026-05-10',
      mid_term_marks: 25, // continuous assessment out of 30
      ospe_marks: 18, // practical out of 20
      sem_marks: 42, // written out of 50
      marks_obtained: 85,
      max_marks: 100,
      full_marks: 'CA: 30, OSPE: 20, Written: 50',
      grade: 'A',
      cleanliness_grade: 'A',
      behaviour_grade: 'A+',
      presentation_grade: 'A',
      sports_grade: 'B',
      total_classes: 40,
      total_absentees: 2,
      total_dormitory_absence: 0,
      remarks: 'Excellent comprehension of macroscopic pathological lesions. Keep up the high standard.',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'exm_2',
      student_id: 'stu_2',
      student_name: 'Marcus Vance',
      class_name: 'MBBS-2A',
      college_id: 'col_primary',
      college_name: college.name,
      batch_id: 'bat_mbbs_24',
      batch_name: 'MBBS Cohort 2024-2029',
      semester: 'Semester 3',
      exam_name: 'Mid-term evaluation',
      subject: 'Systemic Pathology',
      exam_date: '2026-05-10',
      mid_term_marks: 15,
      ospe_marks: 12,
      sem_marks: 31,
      marks_obtained: 58, // Failing threshold is 60!
      max_marks: 100,
      full_marks: 'CA: 30, OSPE: 20, Written: 50',
      grade: 'F',
      cleanliness_grade: 'B',
      behaviour_grade: 'B',
      presentation_grade: 'C',
      sports_grade: 'A',
      total_classes: 40,
      total_absentees: 8,
      total_dormitory_absence: 3,
      remarks: 'Fails to meet the 60% passing mark. Needs significant counseling on clinical correlation and laboratory diagnosis.',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  setStorageData('Examination', examinations);

  // 7. Behaviour Record
  const behaviorRecords = [
    {
      id: 'beh_1',
      student_id: 'stu_1',
      student_name: 'Anya Chen',
      class_name: 'MBBS-2A',
      date: '2026-04-18',
      type: 'Positive',
      category: 'Leadership',
      description: 'Demonstrated exceptional leadership and coordination during the setup of the Annual Community Health Camp.',
      action_taken: 'Commendation Letter from Department Chair',
      reported_by: 'Dr. Sarah Smith',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'beh_2',
      student_id: 'stu_2',
      student_name: 'Marcus Vance',
      class_name: 'MBBS-2A',
      date: '2026-05-12',
      type: 'Negative',
      category: 'Discipline',
      description: 'Missed two consecutive mandatory laboratory reviews without formal notice and was late to clinical wards.',
      action_taken: 'Official Warning Issued',
      reported_by: 'Prof. Arthur Pendelton',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  setStorageData('BehaviourRecord', behaviorRecords);

  // 8. Exam Schedule
  const examSchedules = [
    {
      id: 'sch_1',
      exam_name: 'Final Examination - Semester 3',
      subject: 'Clinical Pathology',
      class_name: 'MBBS-2A',
      college_id: 'col_primary',
      college_name: college.name,
      batch_id: 'bat_mbbs_24',
      batch_name: 'MBBS Cohort 2024-2029',
      semester: 'Semester 3',
      exam_date: '2026-06-15',
      start_time: '09:00',
      end_time: '12:00',
      venue: 'Main Lecture Hall 1',
      invigilator: 'Dr. Sarah Smith',
      total_marks: 100,
      status: 'Scheduled',
      notes: 'Please arrive 15 minutes before the start time. Handheld calculators and smartphones are strictly prohibited.',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'sch_2',
      exam_name: 'Practical OSPE - Pathology',
      subject: 'Pathology Lab OSPE',
      class_name: 'MBBS-2A',
      college_id: 'col_primary',
      college_name: college.name,
      batch_id: 'bat_mbbs_24',
      batch_name: 'MBBS Cohort 2024-2029',
      semester: 'Semester 3',
      exam_date: '2026-06-17',
      start_time: '10:00',
      end_time: '13:00',
      venue: 'Microbiology & Pathology Lab 2',
      invigilator: 'Dr. Arthur Pendelton',
      total_marks: 50,
      status: 'Scheduled',
      notes: 'Sterilized lab coats and surgical gloves are mandatory for entry. Bring own dissecting kits.',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  setStorageData('ExamSchedule', examSchedules);

  // 9. Users
  const systemUsers = [
    { id: 'usr_admin', email: 'dr.sarah.smith@acadflow.edu', name: 'Dr. Sarah Smith', role: 'admin', createdAt: new Date().toISOString() },
    { id: 'usr_teacher', email: 'prof.arthur@acadflow.edu', name: 'Prof. Arthur Pendelton', role: 'teacher', createdAt: new Date().toISOString() },
    { id: 'usr_normal', email: 'anya.chen@student.aegis-med.edu', name: 'Anya Chen', role: 'user', createdAt: new Date().toISOString() }
  ];
  setStorageData('User', systemUsers);

  // 10. Audit Trail
  const initialAudits = [
    { id: 'aud_1', entity: 'System', recordId: 'sys_init', action: 'CREATE', timestamp: new Date().toISOString(), userId: 'system@acadflow.edu', userName: 'System Seeder', userRole: 'admin', oldData: null, newData: { message: 'Database initialized with standard institution structures.' } }
  ];
  setStorageData('AuditTrail', initialAudits);

  localStorage.setItem('acadflow_seeded', 'true');
  console.log('[DB SEED] Demo data seeding completed successfully!');
};

// Define collections for mock client
const mockEntities = {
  College: new MockCollection('College'),
  Batch: new MockCollection('Batch'),
  Student: new MockCollection('Student'),
  Attendance: new MockCollection('Attendance'),
  Examination: new MockCollection('Examination'),
  BehaviourRecord: new MockCollection('BehaviourRecord'),
  ClassType: new MockCollection('ClassType'),
  ExamSchedule: new MockCollection('ExamSchedule'),
  AuditTrail: new MockCollection('AuditTrail'),
  User: new MockCollection('User'),
  // New fee management collections
  Fee: new MockCollection('Fee'),
  Payment: new MockCollection('Payment'),
  Cashback: new MockCollection('Cashback')
};

// Expose Client
let base44Client;

if (isProduction) {
  console.log('[BASE44] Running in Production mode. Connecting to active Base44 SDK services.');
  // Base44 active client initialization
  const sdkClient = createClient({
    appId: import.meta.env.VITE_BASE44_APP_ID || window.__BASE44_APP_ID__
  });
  
  // Wrap or directly export client, ensuring local extensions are preserved
  base44Client = {
    ...sdkClient,
    // Add audit tracking and relationship validations to live client if needed,
    // or rely on server-side rules.
    seedDemoData
  };
} else {
  console.log('[BASE44] Running in Development mode. Exposing local storage MongoDB mockup client.');
  
  base44Client = {
    entities: mockEntities,
    auth: mockAuth,
    asServiceRole: {
      entities: mockEntities,
      auth: mockAuth
    },
    seedDemoData
  };

  // Seed demo data on initial bundle load if not seeded yet
  seedDemoData();
}

export const base44 = base44Client;
