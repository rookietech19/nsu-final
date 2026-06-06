// Academia Flow ERP - Batch Management View
import React, { useState, useEffect } from 'react';
import { base44 } from '../api/base44Client';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Layers, Plus, Trash2, Edit2, ShieldAlert, Users } from 'lucide-react';

const BatchManagementView = () => {
  const { hasWriteAccess, isAdmin } = useAuth();
  const { triggerToast, trackAction } = useNotifications();
  const [batches, setBatches] = useState([]);
  const [studentCounts, setStudentCounts] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    year: '',
    semester: 'Semester 1',
    description: ''
  });

  const loadData = async () => {
    try {
      const batchList = await base44.entities.Batch.list();
      const studentList = await base44.entities.Student.list();

      // Count students per batch
      const counts = {};
      batchList.forEach(b => {
        counts[b.id] = studentList.filter(s => s.batch_id === b.id).length;
      });

      setBatches(batchList);
      setStudentCounts(counts);
    } catch (err) {
      console.error(err);
      triggerToast('Failed to load batch list.', 'danger');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    if (!hasWriteAccess) {
      triggerToast('Permission Denied: Only Admins/Teachers can create batches.', 'danger');
      return;
    }
    setEditingBatch(null);
    setFormData({ name: '', year: '', semester: 'Semester 1', description: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (batch) => {
    if (!hasWriteAccess) {
      triggerToast('Permission Denied: Only Admins/Teachers can edit batches.', 'danger');
      return;
    }
    setEditingBatch(batch);
    setFormData({
      name: batch.name || '',
      year: batch.year || '',
      semester: batch.semester || 'Semester 1',
      description: batch.description || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!hasWriteAccess) {
      triggerToast('Permission Denied: Only Admins/Teachers can delete batches.', 'danger');
      return;
    }

    if (window.confirm('Are you sure you want to delete this cohort batch?')) {
      try {
        const deleted = await base44.entities.Batch.delete(id);
        trackAction('Batch', 'DELETE', deleted); // Track for undo
        triggerToast('Batch cohort removed successfully.', 'success');
        loadData();
      } catch (err) {
        console.error(err);
        triggerToast(err.message, 'danger'); // Shows constraint messages, e.g. contains students
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const colList = await base44.entities.College.list();
      const collegeId = colList[0]?.id || 'col_primary';
      const collegeName = colList[0]?.name || 'Primary College';

      const payload = {
        ...formData,
        college_id: collegeId,
        college_name: collegeName
      };

      if (editingBatch) {
        await base44.entities.Batch.update(editingBatch.id, {
          ...payload,
          version: editingBatch.version
        });
        triggerToast('Batch details updated.', 'success');
      } else {
        await base44.entities.Batch.create(payload);
        triggerToast('New batch cohort registered successfully.', 'success');
      }

      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      triggerToast(err.message, 'danger');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
      
      {/* Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Active Batches</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Define student groups by academic years and active semesters</p>
        </div>
        {hasWriteAccess && (
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} />
            Create Batch
          </button>
        )}
      </div>

      {/* Grid of cohort cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
        gap: '1.5rem'
      }}>
        {batches.map(batch => (
          <div key={batch.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justify: 'center' }}>
                  <Layers size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>{batch.name}</h4>
                  <span className="badge badge-info" style={{ fontSize: '0.65rem', marginTop: '0.25rem' }}>
                    {batch.semester}
                  </span>
                </div>
              </div>
              
              {/* Batch Actions */}
              {hasWriteAccess && (
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button 
                    onClick={() => handleOpenEdit(batch)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem', borderRadius: '4px' }}
                    onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'}
                    onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    title="Edit Batch"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button 
                    onClick={() => handleDelete(batch.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem', borderRadius: '4px' }}
                    onMouseOver={(e) => e.currentTarget.style.color = 'var(--danger)'}
                    onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    title="Delete Batch"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, flexGrow: 1, minHeight: '40px' }}>
              {batch.description || 'No description provided.'}
            </p>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '0.75rem',
              fontSize: '0.8rem',
              color: 'var(--text-muted)'
            }}>
              <span>Academic Year: <strong>{batch.year}</strong></span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Users size={14} />
                <strong>{studentCounts[batch.id] || 0}</strong> Registered
              </span>
            </div>
            
          </div>
        ))}
      </div>

      {/* Create / Edit Modal Form */}
      {isModalOpen && (
  <div style={{
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(4px)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '60px 1rem 1rem 1rem'
  }}>
    <div className="glass-panel-elevated animate-fade-in" style={{
      background: '#ffffff',
      padding: '24px',
      borderRadius: '14px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
      width: '100%',
      maxWidth: '560px',
      maxHeight: '85vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>
              {editingBatch ? 'Modify Batch Cohort' : 'Register New Cohort Batch'}
            </h3>

            <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Batch Name (e.g. MBBS Batch 2024-2029)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.name} 
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Academic Year (e.g. 2024-2029)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.year} 
                    onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                    placeholder="2024-2029"
                    required 
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Current Semester</label>
                  <select 
                    className="form-input" 
                    value={formData.semester} 
                    onChange={(e) => setFormData(prev => ({ ...prev, semester: e.target.value }))}
                  >
                    <option value="Semester 1">Semester 1</option>
                    <option value="Semester 2">Semester 2</option>
                    <option value="Semester 3">Semester 3</option>
                    <option value="Semester 4">Semester 4</option>
                    <option value="Semester 5">Semester 5</option>
                    <option value="Semester 6">Semester 6</option>
                    <option value="Semester 7">Semester 7</option>
                    <option value="Semester 8">Semester 8</option>
                    <option value="Semester 9">Semester 9</option>
                    <option value="Semester 10">Semester 10</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Description / Academic Notes</label>
                <textarea 
                  className="form-input" 
                  style={{ height: '80px', resize: 'none' }}
                  value={formData.description} 
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Cohort
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchManagementView;
