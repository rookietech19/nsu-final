// Academia Flow ERP - Student Directory Management
import React, { useState, useEffect } from 'react';
import { base44 } from '../api/base44Client';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Search, Filter, Plus, FileSpreadsheet, Trash2, Edit2, Eye, UserX, UserCheck } from 'lucide-react';

const StudentManagementView = ({ setActiveView, setSelectedStudentId }) => {
  const { hasWriteAccess, isAdmin } = useAuth();
  const { triggerToast, trackAction } = useNotifications();
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  
  // Roster filters
  const [search, setSearch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('All');
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false);
  const [csvPreview, setCsvPreview] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    roll_number: '',
    date_of_birth: '',
    gender: 'Male',
    phone: '',
    email: '',
    address: '',
    photo_url: '',
    class_name: '',
    department: 'Medicine',
    batch_id: '',
    admission_date: '',
    status: 'Active',
    guardian_name: '',
    guardian_phone: ''
  });

  const loadData = async () => {
    try {
      const studentList = await base44.entities.Student.list();
      const batchList = await base44.entities.Batch.list();
      setStudents(studentList);
      setBatches(batchList);

      // Default the form batch selection to the first available batch if not set
      if (batchList.length > 0 && !formData.batch_id) {
        setFormData(prev => ({ ...prev, batch_id: batchList[0].id }));
      }
    } catch (err) {
      console.error(err);
      triggerToast('Failed to load student directory.', 'danger');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    if (!hasWriteAccess) {
      triggerToast('Permission Denied: Only Admins/Teachers can enroll students.', 'danger');
      return;
    }
    setEditingStudent(null);
    setFormData({
      full_name: '',
      roll_number: '',
      date_of_birth: '',
      gender: 'Male',
      phone: '',
      email: '',
      address: '',
      photo_url: '',
      class_name: '',
      department: 'Medicine',
      batch_id: batches[0]?.id || '',
      admission_date: new Date().toISOString().split('T')[0],
      status: 'Active',
      guardian_name: '',
      guardian_phone: ''
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (student) => {
    if (!hasWriteAccess) {
      triggerToast('Permission Denied: Only Admins/Teachers can edit student records.', 'danger');
      return;
    }
    setEditingStudent(student);
    setFormData({
      full_name: student.full_name || '',
      roll_number: student.roll_number || '',
      date_of_birth: student.date_of_birth || '',
      gender: student.gender || 'Male',
      phone: student.phone || '',
      email: student.email || '',
      address: student.address || '',
      photo_url: student.photo_url || '',
      class_name: student.class_name || '',
      department: student.department || 'Medicine',
      batch_id: student.batch_id || '',
      admission_date: student.admission_date || '',
      status: student.status || 'Active',
      guardian_name: student.guardian_name || '',
      guardian_phone: student.guardian_phone || ''
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!hasWriteAccess) {
      triggerToast('Permission Denied: Only Admins/Teachers can delete student records.', 'danger');
      return;
    }

    if (window.confirm('WARNING: Deleting this student will delete all their academic and attendance logs. Are you sure you want to proceed?')) {
      try {
        const deleted = await base44.entities.Student.delete(id);
        trackAction('Student', 'DELETE', deleted); // Store for undo
        triggerToast(`Successfully de-enrolled ${deleted.full_name}.`, 'success');
        loadData();
      } catch (err) {
        console.error(err);
        triggerToast(err.message, 'danger');
      }
    }
  };

  const handleToggleStatus = async (student) => {
    if (!hasWriteAccess) {
      triggerToast('Permission Denied: Only Admins/Teachers can toggle status.', 'danger');
      return;
    }

    const nextStatus = student.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await base44.entities.Student.update(student.id, {
        status: nextStatus,
        version: student.version
      });
      triggerToast(`Status changed for ${student.full_name} to ${nextStatus}.`, 'success');
      loadData();
    } catch (err) {
      triggerToast(err.message, 'danger');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedBatchObj = batches.find(b => b.id === formData.batch_id);
      const batchName = selectedBatchObj ? selectedBatchObj.name : '';
      
      const colList = await base44.entities.College.list();
      const collegeId = colList[0]?.id || 'col_primary';
      const collegeName = colList[0]?.name || 'Primary College';

      const payload = {
        ...formData,
        batch_name: batchName,
        college_id: collegeId,
        college_name: collegeName
      };

      if (editingStudent) {
        await base44.entities.Student.update(editingStudent.id, {
          ...payload,
          version: editingStudent.version
        });
        triggerToast(`Profile updated for ${formData.full_name}.`, 'success');
      } else {
        await base44.entities.Student.create(payload);
        triggerToast(`Successfully enrolled student ${formData.full_name}.`, 'success');
      }

      setIsFormOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      triggerToast(err.message, 'danger');
    }
  };

  // CSV Bulk Importer Logic
  const handleCsvFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        triggerToast('Empty or invalid CSV file format.', 'danger');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
      const parsedData = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
        const row = {};
        
        headers.forEach((header, idx) => {
          row[header] = values[idx] || '';
        });

        if (row.full_name && row.roll_number && row.class_name) {
          parsedData.push(row);
        }
      }

      setCsvPreview(parsedData);
    };
    reader.readAsText(file);
  };

  const handleConfirmCsvImport = async () => {
    if (csvPreview.length === 0) return;

    let successCount = 0;
    let failCount = 0;
    let lastError = '';

    const defaultBatchId = batches[0]?.id || '';
    const defaultBatchName = batches[0]?.name || '';
    
    const colList = await base44.entities.College.list();
    const collegeId = colList[0]?.id || 'col_primary';
    const collegeName = colList[0]?.name || 'Primary College';

    for (const record of csvPreview) {
      try {
        await base44.entities.Student.create({
          full_name: record.full_name,
          roll_number: record.roll_number,
          date_of_birth: record.date_of_birth || '2004-01-01',
          gender: record.gender || 'Male',
          phone: record.phone || '',
          email: record.email || `${record.roll_number.toLowerCase()}@student.aegis-med.edu`,
          address: record.address || 'Medical District Dorms',
          photo_url: record.photo_url || '',
          class_name: record.class_name,
          department: record.department || 'Medicine',
          batch_id: record.batch_id || defaultBatchId,
          batch_name: record.batch_name || defaultBatchName,
          admission_date: record.admission_date || new Date().toISOString().split('T')[0],
          status: record.status || 'Active',
          guardian_name: record.guardian_name || '',
          guardian_phone: record.guardian_phone || '',
          passport_url: '',
          other_documents: []
        });
        successCount++;
      } catch (err) {
        failCount++;
        lastError = err.message;
      }
    }

    triggerToast(`Bulk Import Finished: ${successCount} successfully enrolled. ${failCount} failed.`, successCount > 0 ? 'success' : 'danger');
    if (failCount > 0) {
      console.warn('Failed bulk rows error:', lastError);
    }
    
    setIsCsvImportOpen(false);
    setCsvPreview([]);
    loadData();
  };

  // Filter List based on inputs
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.full_name.toLowerCase().includes(search.toLowerCase()) || 
                          student.roll_number.toLowerCase().includes(search.toLowerCase());
    
    const matchesBatch = selectedBatch === 'All' || student.batch_id === selectedBatch;
    const matchesClass = selectedClass === 'All' || student.class_name === selectedClass;
    const matchesStatus = selectedStatus === 'All' || student.status === selectedStatus;

    return matchesSearch && matchesBatch && matchesClass && matchesStatus;
  });

  // Extract unique classes for filter list
  const uniqueClasses = [...new Set(students.map(s => s.class_name))];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
      
      {/* Top Banner and Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Student Roster Directory</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
            Showing {filteredStudents.length} of {students.length} enrolled students
          </p>
        </div>

        {hasWriteAccess && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={() => setIsCsvImportOpen(true)}>
              <FileSpreadsheet size={16} />
              CSV Bulk Import
            </button>
            <button className="btn btn-primary" onClick={handleOpenCreate}>
              <Plus size={16} />
              Enroll Student
            </button>
          </div>
        )}
      </div>

      {/* Advanced Filter Bar */}
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ flexGrow: 1, minWidth: '220px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search by student name or roll number..." 
            className="form-input" 
            style={{ paddingLeft: '2.25rem' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Batch Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={14} style={{ color: 'var(--text-muted)' }} />
          <select 
            className="form-input" 
            style={{ width: '160px', padding: '0.5rem' }}
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
          >
            <option value="All">All Batches</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* Class Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <select 
            className="form-input" 
            style={{ width: '130px', padding: '0.5rem' }}
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="All">All Classes</option>
            {uniqueClasses.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <select 
            className="form-input" 
            style={{ width: '120px', padding: '0.5rem' }}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Graduated">Graduated</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Roster Table */}
      <div className="table-container">
        <table className="table-main">
          <thead>
            <tr>
              <th className="table-th">Roll Number</th>
              <th className="table-th">Student Details</th>
              <th className="table-th">Class / Section</th>
              <th className="table-th">Department</th>
              <th className="table-th">Status</th>
              <th className="table-th" style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="6" className="table-td" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No student records matched the criteria.
                </td>
              </tr>
            ) : (
              filteredStudents.map(student => (
                <tr key={student.id} className="table-row">
                  {/* Roll Number */}
                  <td className="table-td" style={{ fontWeight: 600, color: 'var(--primary)' }}>
                    {student.roll_number}
                  </td>
                  
                  {/* Photo & Name */}
                  <td className="table-td">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img 
                        src={student.photo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${student.full_name}`} 
                        alt={student.full_name} 
                        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{student.full_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{student.email}</div>
                      </div>
                    </div>
                  </td>
                  
                  {/* Class */}
                  <td className="table-td">
                    <div style={{ fontWeight: 500 }}>{student.class_name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{student.batch_name}</div>
                  </td>
                  
                  {/* Department */}
                  <td className="table-td">{student.department}</td>
                  
                  {/* Status */}
                  <td className="table-td">
                    <span className={`badge ${
                      student.status === 'Active' ? 'badge-success' : 
                      student.status === 'Inactive' ? 'badge-warning' : 
                      student.status === 'Graduated' ? 'badge-info' : 'badge-danger'
                    }`}>
                      {student.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="table-td">
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      {/* View Profile */}
                      <button 
                        onClick={() => {
                          setSelectedStudentId(student.id);
                          setActiveView('student-profile');
                        }}
                        className="btn btn-secondary" 
                        style={{ padding: '0.35rem 0.65rem' }}
                        title="View Detailed Profile"
                      >
                        <Eye size={14} />
                      </button>
                      
                      {/* Edit */}
                      {hasWriteAccess && (
                        <>
                          <button 
                            onClick={() => handleOpenEdit(student)}
                            className="btn btn-secondary" 
                            style={{ padding: '0.35rem 0.65rem' }}
                            title="Edit Student Info"
                          >
                            <Edit2 size={14} />
                          </button>
                          
                          {/* Toggle Status */}
                          <button 
                            onClick={() => handleToggleStatus(student)}
                            className="btn btn-secondary" 
                            style={{ padding: '0.35rem 0.65rem' }}
                            title={student.status === 'Active' ? 'Suspend Student' : 'Activate Student'}
                          >
                            {student.status === 'Active' ? <UserX size={14} style={{ color: 'var(--warning)' }} /> : <UserCheck size={14} style={{ color: 'var(--success)' }} />}
                          </button>
                          
                          {/* Delete */}
                          <button 
                            onClick={() => handleDelete(student.id)}
                            className="btn btn-secondary" 
                            style={{ padding: '0.35rem 0.65rem' }}
                            title="Remove Student Record"
                          >
                            <Trash2 size={14} style={{ color: 'var(--danger)' }} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CSV Import Modal */}
      {isCsvImportOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '60px 1.5rem 1.5rem 1.5rem'
        }}>
          <div className="glass-panel-elevated" style={{ width: '100%', maxWidth: '600px', padding: '2rem', background: 'var(--card-bg)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>CSV Bulk Student Enrollment</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Upload a CSV file. The first row must contain column headers. Minimum required fields: 
              <code> full_name, roll_number, class_name</code>
            </p>

            <div className="form-group">
              <input type="file" accept=".csv" onChange={handleCsvFileChange} className="form-input" />
            </div>

            {csvPreview.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <h4 style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Parsed Preview ({csvPreview.length} records found)</h4>
                <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.75rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'rgba(0,0,0,0.02)', position: 'sticky', top: 0 }}>
                      <tr>
                        <th style={{ padding: '0.5rem' }}>Roll Number</th>
                        <th style={{ padding: '0.5rem' }}>Name</th>
                        <th style={{ padding: '0.5rem' }}>Class</th>
                        <th style={{ padding: '0.5rem' }}>Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.slice(0, 10).map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.5rem' }}>{row.roll_number}</td>
                          <td style={{ padding: '0.5rem' }}>{row.full_name}</td>
                          <td style={{ padding: '0.5rem' }}>{row.class_name}</td>
                          <td style={{ padding: '0.5rem' }}>{row.email || 'Auto-generated'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {csvPreview.length > 10 && (
                    <div style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      ... and {csvPreview.length - 10} more rows.
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => { setIsCsvImportOpen(false); setCsvPreview([]); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleConfirmCsvImport} disabled={csvPreview.length === 0}>
                Confirm Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Roster Create/Edit Form Modal */}
      {isFormOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '60px 1.5rem 1.5rem 1.5rem'
        }}>
          <div 
            className="glass-panel-elevated animate-fade-in" 
            style={{ 
              width: '100%', 
              maxWidth: '680px', 
              maxHeight: '85vh',
              padding: '1.5rem',
              background: 'var(--card-bg)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>
              {editingStudent ? 'Edit Student Record' : 'Enroll Student'}
            </h3>

            <form onSubmit={handleFormSubmit} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              
              {/* Section 1: Personal Info */}
              <h4 style={{ fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>Personal Information</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.full_name} 
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    required 
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Roll Number</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.roll_number} 
                    onChange={(e) => setFormData(prev => ({ ...prev, roll_number: e.target.value }))}
                    placeholder="e.g. AIMS-2026-042"
                    required 
                    disabled={!!editingStudent}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Date of Birth</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={formData.date_of_birth} 
                    onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Gender</label>
                  <select 
                    className="form-input" 
                    value={formData.gender} 
                    onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Photo URL (Optional)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.photo_url} 
                    onChange={(e) => setFormData(prev => ({ ...prev, photo_url: e.target.value }))}
                  />
                </div>
              </div>

              {/* Section 2: Contact Info */}
              <h4 style={{ fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>Contact Details</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Phone Number</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.phone} 
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    value={formData.email} 
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Residential Address</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.address} 
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>

              {/* Section 3: Institutional Info */}
              <h4 style={{ fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>Institutional Details</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Class Name / Section (e.g. MBBS-2A)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.class_name} 
                    onChange={(e) => setFormData(prev => ({ ...prev, class_name: e.target.value }))}
                    placeholder="e.g. MBBS-2A"
                    required 
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Department</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.department} 
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Academic Batch</label>
                  <select 
                    className="form-input" 
                    value={formData.batch_id} 
                    onChange={(e) => setFormData(prev => ({ ...prev, batch_id: e.target.value }))}
                    required
                  >
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Admission Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={formData.admission_date} 
                    onChange={(e) => setFormData(prev => ({ ...prev, admission_date: e.target.value }))}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Status</label>
                  <select 
                    className="form-input" 
                    value={formData.status} 
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Graduated">Graduated</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Section 4: Emergency Contacts */}
              <h4 style={{ fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>Guardian / Emergency Contact</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Guardian Full Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.guardian_name} 
                    onChange={(e) => setFormData(prev => ({ ...prev, guardian_name: e.target.value }))}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Guardian Contact Number</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.guardian_phone} 
                    onChange={(e) => setFormData(prev => ({ ...prev, guardian_phone: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex',
                justifyContent: 'flex-end',
                gap: '1rem',
                borderTop: '1px solid var(--border-color)',
                paddingTop: '1.25rem',
                marginTop: '1.5rem',
                position: 'sticky',
                bottom: 0,
                background: 'var(--card-bg)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Enroll Student</button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentManagementView;
