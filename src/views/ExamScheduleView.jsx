// Academia Flow ERP - Exam Schedule Timetable Module
import React, { useState, useEffect } from 'react';
import { base44 } from '../api/base44Client';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { CalendarRange, Plus, Edit2, Trash2, ShieldAlert, Save, Printer, Clock, MapPin, User } from 'lucide-react';

const ExamScheduleView = () => {
  const { hasWriteAccess } = useAuth();
  const { triggerToast, trackAction } = useNotifications();

  // Collections
  const [batches, setBatches] = useState([]);
  const [schedules, setSchedules] = useState([]);
  
  // Filters
  const [selectedBatch, setSelectedBatch] = useState('All');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    exam_name: '',
    subject: '',
    class_name: '',
    batch_id: '',
    semester: 'Semester 3',
    exam_date: '',
    start_time: '09:00',
    end_time: '12:00',
    venue: '',
    invigilator: '',
    total_marks: 100,
    status: 'Scheduled',
    notes: ''
  });

  const loadData = async () => {
    try {
      const batchList = await base44.entities.Batch.list();
      const schedList = await base44.entities.ExamSchedule.list();
      
      setBatches(batchList);
      setSchedules(schedList);

      if (batchList.length > 0 && !formData.batch_id) {
        setFormData(prev => ({ ...prev, batch_id: batchList[0].id }));
      }
    } catch (err) {
      console.error(err);
      triggerToast('Failed to load examination timetable.', 'danger');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    if (!hasWriteAccess) {
      triggerToast('Permission Denied: Only Admins/Teachers can schedule exams.', 'danger');
      return;
    }
    setEditingSchedule(null);
    setFormData({
      exam_name: '',
      subject: '',
      class_name: '',
      batch_id: batches[0]?.id || '',
      semester: 'Semester 3',
      exam_date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0], // 5 days from now
      start_time: '09:00',
      end_time: '12:00',
      venue: 'Exam Hall 1',
      invigilator: 'Dr. Sarah Smith',
      total_marks: 100,
      status: 'Scheduled',
      notes: ''
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (schedule) => {
    if (!hasWriteAccess) {
      triggerToast('Permission Denied: Only Admins/Teachers can edit schedules.', 'danger');
      return;
    }
    setEditingSchedule(schedule);
    setFormData({
      exam_name: schedule.exam_name || '',
      subject: schedule.subject || '',
      class_name: schedule.class_name || '',
      batch_id: schedule.batch_id || '',
      semester: schedule.semester || 'Semester 3',
      exam_date: schedule.exam_date || '',
      start_time: schedule.start_time || '09:00',
      end_time: schedule.end_time || '12:00',
      venue: schedule.venue || '',
      invigilator: schedule.invigilator || '',
      total_marks: schedule.total_marks ?? 100,
      status: schedule.status || 'Scheduled',
      notes: schedule.notes || ''
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!hasWriteAccess) {
      triggerToast('Permission Denied: Only Admins/Teachers can delete schedules.', 'danger');
      return;
    }

    if (window.confirm('Are you sure you want to cancel and delete this examination schedule?')) {
      try {
        const deleted = await base44.entities.ExamSchedule.delete(id);
        trackAction('ExamSchedule', 'DELETE', deleted); // Track undo
        triggerToast('Exam schedule deleted successfully.', 'success');
        loadData();
      } catch (err) {
        triggerToast(err.message, 'danger');
      }
    }
  };

  const handleSubmit = async (e) => {
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

      if (editingSchedule) {
        await base44.entities.ExamSchedule.update(editingSchedule.id, {
          ...payload,
          version: editingSchedule.version
        });
        triggerToast('Exam schedule updated.', 'success');
      } else {
        await base44.entities.ExamSchedule.create(payload);
        triggerToast('Examination schedule published successfully.', 'success');
      }

      setIsFormOpen(false);
      loadData();
    } catch (err) {
      triggerToast(err.message, 'danger');
    }
  };

  // Filter list
  const filteredSchedules = schedules.filter(s => {
    return selectedBatch === 'All' || s.batch_id === selectedBatch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
      
      {/* Top Header Actions */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Examination Timetable Schedules</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Schedule and publish upcoming examinations and invigilator duties</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => window.print()}>
            <Printer size={16} />
            Print Timetable
          </button>
          {hasWriteAccess && (
            <button className="btn btn-primary" onClick={handleOpenCreate}>
              <Plus size={16} />
              Schedule Exam
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel no-print" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Filter Batch:</span>
          <select 
            className="form-input" 
            style={{ width: '220px', padding: '0.5rem' }}
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
          >
            <option value="All">All Batches</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Schedule list grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {filteredSchedules.length === 0 ? (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No upcoming examination timetables scheduled.
          </div>
        ) : (
          filteredSchedules.map(schedule => {
            const statusClass = 
              schedule.status === 'Completed' ? 'badge-success' : 
              schedule.status === 'Ongoing' ? 'badge-warning' : 
              schedule.status === 'Cancelled' ? 'badge-danger' : 'badge-info';

            return (
              <div 
                key={schedule.id}
                className="glass-panel animate-fade-in"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  borderLeft: `5px solid ${
                    schedule.status === 'Cancelled' ? 'var(--danger)' : 
                    schedule.status === 'Completed' ? 'var(--success)' : 'var(--primary)'
                  }`,
                  pageBreakInside: 'avoid'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                      {schedule.exam_name} &bull; {schedule.subject}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      Cohort: {schedule.batch_name} ({schedule.class_name}) &bull; Semester: {schedule.semester}
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className={`badge ${statusClass}`}>{schedule.status}</span>
                    
                    {hasWriteAccess && (
                      <div className="no-print" style={{ display: 'flex', gap: '0.25rem' }}>
                        <button 
                          onClick={() => handleOpenEdit(schedule)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
                          onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'}
                          onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                          title="Edit Timetable"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button 
                          onClick={() => handleDelete(schedule.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
                          onMouseOver={(e) => e.currentTarget.style.color = 'var(--danger)'}
                          onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                          title="Delete Timetable"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Details layout */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  fontSize: '0.85rem',
                  background: 'rgba(0,0,0,0.01)',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={16} style={{ color: 'var(--text-muted)' }} />
                    <span>Time: <strong>{schedule.exam_date} &bull; {schedule.start_time} - {schedule.end_time}</strong></span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={16} style={{ color: 'var(--text-muted)' }} />
                    <span>Hall Venue: <strong>{schedule.venue}</strong></span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={16} style={{ color: 'var(--text-muted)' }} />
                    <span>Proctor/Invigilator: <strong>{schedule.invigilator}</strong></span>
                  </div>
                </div>

                {/* Notes */}
                {schedule.notes && (
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    * Guidelines: {schedule.notes}
                  </p>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* Form Modal */}
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
              maxWidth: '560px', 
              maxHeight: '85vh',
              padding: '2rem', 
              background: 'var(--card-bg)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>
              {editingSchedule ? 'Modify Examination Details' : 'Publish Examination Schedule'}
            </h3>

            <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Exam Name / Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.exam_name} 
                  onChange={(e) => setFormData(prev => ({ ...prev, exam_name: e.target.value }))}
                  placeholder="e.g. Final Examination - Semester 3"
                  required 
                />
              </div>

              <div className="grid-2-col">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Subject Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.subject} 
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="e.g. Systemic Pathology"
                    required 
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Class Name / Section</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.class_name} 
                    onChange={(e) => setFormData(prev => ({ ...prev, class_name: e.target.value }))}
                    placeholder="e.g. MBBS-2A"
                    required 
                  />
                </div>
              </div>

              <div className="grid-2-col">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Target Batch / Cohort</label>
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
                  <label className="form-label">Semester</label>
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
                  </select>
                </div>
              </div>

              <div className="grid-3-col">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Exam Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={formData.exam_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, exam_date: e.target.value }))}
                    required 
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Start Time</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.start_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                    placeholder="09:00"
                    required 
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">End Time</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.end_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                    placeholder="12:00"
                    required 
                  />
                </div>
              </div>

              <div className="grid-2-col">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Venue Hall</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.venue}
                    onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
                    placeholder="Exam Room 1"
                    required 
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Invigilator Staff</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.invigilator}
                    onChange={(e) => setFormData(prev => ({ ...prev, invigilator: e.target.value }))}
                    required 
                  />
                </div>
              </div>

              <div className="grid-2-col">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Total Marks</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={formData.total_marks}
                    onChange={(e) => setFormData(prev => ({ ...prev, total_marks: Number(e.target.value) }))}
                    required 
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Status</label>
                  <select 
                    className="form-input" 
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Additional notes / rules (Optional)</label>
                <textarea 
                  className="form-input" 
                  style={{ height: '70px', resize: 'none' }}
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Publish Schedule</button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ExamScheduleView;
