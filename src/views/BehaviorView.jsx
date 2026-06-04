// Academia Flow ERP - Behavior & Conduct tracking
import React, { useState, useEffect } from 'react';
import { base44 } from '../api/base44Client';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { HeartHandshake, Plus, Filter, FileText, Trash2, Printer, ShieldAlert, Award } from 'lucide-react';

const BehaviorView = () => {
  const { user, hasWriteAccess } = useAuth();
  const { triggerToast, trackAction } = useNotifications();

  // Collections
  const [students, setStudents] = useState([]);
  const [college, setCollege] = useState(null);
  const [incidents, setIncidents] = useState([]);

  // Tabs state
  const [activeTab, setActiveTab] = useState('list');

  // Filter state
  const [selectedStudent, setSelectedStudent] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  
  // Certificate specific student selector
  const [certStudentId, setCertStudentId] = useState('');
  const [certStudentObj, setCertStudentObj] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    student_id: '',
    date: new Date().toISOString().split('T')[0],
    type: 'Positive',
    category: 'Leadership',
    description: '',
    action_taken: 'None',
    reported_by: ''
  });

  const loadData = async () => {
    try {
      const studentList = await base44.entities.Student.list();
      const colList = await base44.entities.College.list();
      const logs = await base44.entities.BehaviourRecord.list();

      setStudents(studentList);
      setIncidents(logs);
      if (colList.length > 0) setCollege(colList[0]);

      if (studentList.length > 0) {
        setFormData(prev => ({ 
          ...prev, 
          student_id: studentList[0].id,
          reported_by: user?.name || ''
        }));
        setCertStudentId(studentList[0].id);
      }
    } catch (err) {
      console.error(err);
      triggerToast('Failed to load student conduct logs.', 'danger');
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleOpenCreate = () => {
    if (!hasWriteAccess) {
      triggerToast('Permission Denied: Only Admins/Teachers can log behavioral incidents.', 'danger');
      return;
    }
    setFormData({
      student_id: students[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      type: 'Positive',
      category: 'Leadership',
      description: '',
      action_taken: 'None',
      reported_by: user?.name || 'Dr. Sarah Smith'
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!hasWriteAccess) {
      triggerToast('Permission Denied: Only Admins/Teachers can delete logs.', 'danger');
      return;
    }

    if (window.confirm('Are you sure you want to delete this behavior record?')) {
      try {
        const deleted = await base44.entities.BehaviourRecord.delete(id);
        trackAction('BehaviourRecord', 'DELETE', deleted); // Track undo
        triggerToast('Incident record removed.', 'success');
        loadData();
      } catch (err) {
        triggerToast(err.message, 'danger');
      }
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedStudentObj = students.find(s => s.id === formData.student_id);
      const studentName = selectedStudentObj ? selectedStudentObj.full_name : '';
      const className = selectedStudentObj ? selectedStudentObj.class_name : '';

      await base44.entities.BehaviourRecord.create({
        ...formData,
        student_name: studentName,
        class_name: className
      });

      triggerToast('Behavior incident logged successfully.', 'success');
      setIsFormOpen(false);
      loadData();
    } catch (err) {
      triggerToast(err.message, 'danger');
    }
  };

  const handleGenerateCertificate = () => {
    const studentObj = students.find(s => s.id === certStudentId);
    if (!studentObj) {
      triggerToast('Student record not found.', 'warning');
      return;
    }
    setCertStudentObj(studentObj);
    setIsCertificateOpen(true);
    triggerToast('Conduct Certificate generated.', 'info');
  };

  // Filter list
  const filteredIncidents = incidents.filter(log => {
    const matchesStudent = selectedStudent === 'All' || log.student_id === selectedStudent;
    const matchesType = selectedType === 'All' || log.type === selectedType;
    const matchesCategory = selectedCategory === 'All' || log.category === selectedCategory;

    return matchesStudent && matchesType && matchesCategory;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
      
      {/* Tabs Menu */}
      <div className="tabs-container no-print">
        <button className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>
          <HeartHandshake size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Incident Log
        </button>
        <button className={`tab-btn ${activeTab === 'certificate' ? 'active' : ''}`} onClick={() => setActiveTab('certificate')}>
          <FileText size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Conduct Certificate
        </button>
      </div>

      {/* TAB CONTENT: INCIDENT LIST */}
      {activeTab === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Header Action */}
          <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Behavior Incident Log</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Track negative disciplinary actions or positive leadership highlights</p>
            </div>
            {hasWriteAccess && (
              <button className="btn btn-primary" onClick={handleOpenCreate}>
                <Plus size={16} />
                Log Incident
              </button>
            )}
          </div>

          {/* Filter Bar */}
          <div className="glass-panel no-print" style={{ padding: '1rem', display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Student:</span>
              <select 
                className="form-input" 
                style={{ width: '220px', padding: '0.5rem' }}
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
              >
                <option value="All">All Students</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.full_name} ({s.roll_number})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Type:</span>
              <select 
                className="form-input" 
                style={{ width: '130px', padding: '0.5rem' }}
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="All">All Types</option>
                <option value="Positive">Positive</option>
                <option value="Negative">Negative</option>
                <option value="Neutral">Neutral</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Category:</span>
              <select 
                className="form-input" 
                style={{ width: '140px', padding: '0.5rem' }}
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="All">All Categories</option>
                <option value="Discipline">Discipline</option>
                <option value="Participation">Participation</option>
                <option value="Leadership">Leadership</option>
                <option value="Sports">Sports</option>
                <option value="Academic">Academic</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Logs Card grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredIncidents.length === 0 ? (
              <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No behavioral entries recorded matching the query.
              </div>
            ) : (
              filteredIncidents.map(log => (
                <div 
                  key={log.id} 
                  className="glass-panel animate-fade-in"
                  style={{
                    padding: '1.25rem',
                    borderLeft: `4px solid ${
                      log.type === 'Negative' ? 'var(--danger)' : 
                      log.type === 'Positive' ? 'var(--success)' : 'var(--text-muted)'
                    }`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.925rem', fontWeight: 700 }}>
                        {log.student_name} ({log.class_name})
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        Category: <strong>{log.category}</strong> &bull; Incident Date: {log.date}
                      </p>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className={`badge ${
                        log.type === 'Positive' ? 'badge-success' : 
                        log.type === 'Negative' ? 'badge-danger' : 'badge-info'
                      }`}>
                        {log.type}
                      </span>
                      {hasWriteAccess && (
                        <button 
                          onClick={() => handleDelete(log.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
                          onMouseOver={(e) => e.currentTarget.style.color = 'var(--danger)'}
                          onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                          title="Delete Record"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {log.description}
                  </p>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '0.625rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)'
                  }}>
                    <span>Consequence: <strong>{log.action_taken || 'None'}</strong></span>
                    <span>Evaluated by: <strong>{log.reported_by}</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: CONDUCT CERTIFICATE */}
      {activeTab === 'certificate' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Certificate Selector bar */}
          <div className="glass-panel no-print" style={{ padding: '1.25rem', display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Select Student:</span>
              <select 
                className="form-input" 
                style={{ width: '260px', padding: '0.5rem' }}
                value={certStudentId}
                onChange={(e) => setCertStudentId(e.target.value)}
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.full_name} ({s.roll_number})</option>
                ))}
              </select>
            </div>
            
            <button className="btn btn-primary" onClick={handleGenerateCertificate}>
              Generate Certificate
            </button>
            
            {certStudentObj && isCertificateOpen && (
              <button className="btn btn-secondary" style={{ marginLeft: 'auto' }} onClick={() => window.print()}>
                <Printer size={16} />
                Print Certificate
              </button>
            )}
          </div>

          {/* Certificate Printable panel */}
          {isCertificateOpen && certStudentObj ? (
            <div 
              className="glass-panel" 
              style={{ 
                padding: '4rem', 
                background: 'white', 
                color: 'black', 
                border: '15px double #334155', 
                boxShadow: 'none', 
                textAlign: 'center',
                fontFamily: 'Georgia, serif',
                position: 'relative'
              }}
            >
              {/* Corner Ornaments simulation */}
              <div style={{ position: 'absolute', top: '15px', left: '15px', fontSize: '1.5rem', color: '#64748b' }}>✦</div>
              <div style={{ position: 'absolute', top: '15px', right: '15px', fontSize: '1.5rem', color: '#64748b' }}>✦</div>
              <div style={{ position: 'absolute', bottom: '15px', left: '15px', fontSize: '1.5rem', color: '#64748b' }}>✦</div>
              <div style={{ position: 'absolute', bottom: '15px', right: '15px', fontSize: '1.5rem', color: '#64748b' }}>✦</div>

              {/* Institution header */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '1px solid #cbd5e1', paddingBottom: '1.5rem', marginBottom: '2.5rem' }}>
                <img 
                  src={college?.logo_url || "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=120&h=120&q=80"} 
                  alt="Logo" 
                  style={{ height: '60px', marginBottom: '0.75rem' }}
                />
                <h2 style={{ fontSize: '1.65rem', fontWeight: 'bold', margin: 0, textTransform: 'uppercase', color: '#0f172a' }}>
                  {college?.name || 'Aegis Institute of Medical Sciences'}
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#475569', margin: '0.25rem 0' }}>
                  Faculty of Clinical Medicine &bull; Student Records Division
                </p>
              </div>

              {/* Certificate Main Title */}
              <h3 style={{ fontFamily: '"Times New Roman", serif', fontStyle: 'italic', fontSize: '2rem', color: '#1e293b', marginBottom: '1.5rem' }}>
                Certificate of Character & Conduct
              </h3>

              <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#334155', maxWidth: '640px', margin: '0 auto 3rem auto' }}>
                This is to certify that <strong>{certStudentObj.full_name}</strong>, enrolled under Roll Number <strong>{certStudentObj.roll_number}</strong> 
                in the cohort <strong>{certStudentObj.batch_name}</strong> ({certStudentObj.class_name}), has maintained a exemplary character and behavior profile. 
                During their academic tenure at this institution, their conduct has been observed to be <strong>EXCELLENT</strong>, and we commend their leadership traits.
              </p>

              {/* Signatures */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6rem', marginTop: '4rem', textAlign: 'center' }}>
                <div>
                  <div style={{ height: '40px' }}></div>
                  <div style={{ borderTop: '1px solid black', width: '200px', margin: '0 auto', paddingTop: '0.25rem', fontSize: '0.85rem' }}>
                    Dean of Student Affairs
                  </div>
                </div>
                <div>
                  <div style={{ height: '40px', fontStyle: 'italic', fontWeight: 'bold', display: 'flex', alignItems: 'end', justifyContent: 'center', fontSize: '10pt' }}>
                    {college?.dean_name || 'Dr. Arthur Pendelton'}
                  </div>
                  <div style={{ borderTop: '1px solid black', width: '200px', margin: '0 auto', paddingTop: '0.25rem', fontSize: '0.85rem' }}>
                    {college?.dean_title || 'Dean of Medical Faculty'}
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Select a student to generate their Official Character and Conduct Certificate.
            </div>
          )}

        </div>
      )}

      {/* Form Log Modal */}
      {isFormOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '60px 1.5rem 1.5rem 1.5rem'
        }}>
          <div className="glass-panel-elevated animate-fade-in" style={{ 
            width: '100%', 
            maxWidth: '480px', 
            maxHeight: '85vh',
            padding: '2rem', 
            background: 'var(--card-bg)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Log Behavior Incident</h3>

            <form onSubmit={handleFormSubmit} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Student Name</label>
                <select 
                  className="form-input" 
                  value={formData.student_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, student_id: e.target.value }))}
                  required
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.full_name} ({s.roll_number})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Incident Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Evaluation Type</label>
                  <select 
                    className="form-input" 
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="Positive">Positive</option>
                    <option value="Negative">Negative</option>
                    <option value="Neutral">Neutral</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Category</label>
                  <select 
                    className="form-input" 
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="Discipline">Discipline</option>
                    <option value="Participation">Participation</option>
                    <option value="Leadership">Leadership</option>
                    <option value="Sports">Sports</option>
                    <option value="Academic">Academic</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Consequence / Action Taken</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.action_taken}
                    onChange={(e) => setFormData(prev => ({ ...prev, action_taken: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Incident Detailed Description</label>
                <textarea 
                  className="form-input" 
                  style={{ height: '80px', resize: 'none' }}
                  placeholder="Provide precise details of the student's behavior..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Reported By</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.reported_by}
                  onChange={(e) => setFormData(prev => ({ ...prev, reported_by: e.target.value }))}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Log Incident</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default BehaviorView;
