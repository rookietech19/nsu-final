// Academia Flow ERP - Attendance Module
import React, { useState, useEffect } from 'react';
import { base44 } from '../api/base44Client';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { ClipboardCheck, Calendar, Users, ShieldAlert, ArrowRight, Save, Download } from 'lucide-react';

const AttendanceView = () => {
  const { hasWriteAccess } = useAuth();
  const { triggerToast, trackAction } = useNotifications();

  // Collections
  const [batches, setBatches] = useState([]);
  const [classTypes, setClassTypes] = useState([]);
  const [students, setStudents] = useState([]);
  const [uniqueAttendanceSubjects, setUniqueAttendanceSubjects] = useState([]);

  // Active view tab
  const [activeTab, setActiveTab] = useState('mark');

  // Form setup state
  const [setupData, setSetupData] = useState({
    batch_id: '',
    date: new Date().toISOString().split('T')[0],
    subject: 'Systemic Pathology',
    class_type: 'Lecture',
    period: 'Period 1 (08:00 - 09:30)'
  });

  const [isRollCallStarted, setIsRollCallStarted] = useState(false);
  const [rollCallList, setRollCallList] = useState([]); // Array of { student_id, student_name, status, remarks }

  // Reports filters
  const [reportFilter, setReportFilter] = useState({
    batch_id: 'All',
    date: '',
    subject: 'All'
  });
  const [reportLogs, setReportLogs] = useState([]);

  const loadInitialData = async () => {
    try {
      const batchList = await base44.entities.Batch.list();
      const ctList = await base44.entities.ClassType.list();
      const stuList = await base44.entities.Student.list();

      setBatches(batchList);
      setClassTypes(ctList);
      setStudents(stuList);

      // Dynamically build unique subject list from existing attendance records
      const allAtt = await base44.entities.Attendance.list();
      const subjects = [...new Set(allAtt.map(a => a.subject).filter(Boolean))];
      setUniqueAttendanceSubjects(
        subjects.length > 0
          ? subjects
          : ['Systemic Pathology', 'Pathology Lab', 'Human Anatomy', 'Physiology Lecture']
      );

      if (batchList.length > 0) {
        setSetupData(prev => ({ 
          ...prev, 
          batch_id: batchList[0].id
        }));
      }
    } catch (err) {
      console.error(err);
      triggerToast('Failed to load classes or students details.', 'danger');
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Trigger loading report logs
  const loadReports = async () => {
    try {
      let query = {};
      if (reportFilter.batch_id !== 'All') query.batch_id = reportFilter.batch_id;
      if (reportFilter.date) query.date = reportFilter.date;
      if (reportFilter.subject !== 'All') query.subject = reportFilter.subject;

      const logs = await base44.entities.Attendance.filter(query);
      setReportLogs(logs);
    } catch (err) {
      console.error(err);
      triggerToast('Failed to generate attendance reports.', 'danger');
    }
  };

  useEffect(() => {
    if (activeTab === 'reports') {
      loadReports();
    }
  }, [activeTab, reportFilter]);

  // Start the daily roll call
  const handleStartRollCall = async () => {
    const activeBatchObj = batches.find(b => b.id === setupData.batch_id);
    if (!activeBatchObj) {
      triggerToast('Please select a valid cohort batch.', 'warning');
      return;
    }

    try {
      // Get all students enrolled in this batch
      const batchStudents = students.filter(s => s.batch_id === setupData.batch_id && s.status === 'Active');
      
      if (batchStudents.length === 0) {
        triggerToast('No active students enrolled in this cohort batch.', 'warning');
        return;
      }

      // Check if attendance already exists for this block to edit it
      const existingAttendance = await base44.entities.Attendance.filter({
        batch_id: setupData.batch_id,
        date: setupData.date,
        subject: setupData.subject,
        period: setupData.period
      });

      const initialList = batchStudents.map(student => {
        const recorded = existingAttendance.find(a => a.student_id === student.id);
        return {
          student_id: student.id,
          student_name: student.full_name,
          roll_number: student.roll_number,
          class_name: student.class_name,
          status: recorded ? recorded.status : 'Present', // default present
          remarks: recorded ? recorded.remarks : '',
          existingId: recorded ? recorded.id : null,
          existingVersion: recorded ? recorded.version : null
        };
      });

      setRollCallList(initialList);
      setIsRollCallStarted(true);
      triggerToast(`Loaded roster of ${batchStudents.length} students for roll call.`, 'info');
    } catch (err) {
      console.error(err);
      triggerToast('Failed to check existing attendance logs.', 'danger');
    }
  };

  const handleStatusChange = (studentId, nextStatus) => {
    setRollCallList(prev => prev.map(item => {
      if (item.student_id === studentId) {
        return { ...item, status: nextStatus };
      }
      return item;
    }));
  };

  const handleRemarksChange = (studentId, value) => {
    setRollCallList(prev => prev.map(item => {
      if (item.student_id === studentId) {
        return { ...item, remarks: value };
      }
      return item;
    }));
  };

  const handleBulkMark = (status) => {
    setRollCallList(prev => prev.map(item => ({ ...item, status })));
    triggerToast(`Bulk marked all students as ${status}.`, 'info');
  };

  const handleSubmitAttendance = async () => {
    if (!hasWriteAccess) {
      triggerToast('Permission Denied: Only Admins/Teachers can submit attendance sheets.', 'danger');
      return;
    }

    try {
      const activeBatchObj = batches.find(b => b.id === setupData.batch_id);
      const colList = await base44.entities.College.list();
      const collegeId = colList[0]?.id || 'col_primary';
      const collegeName = colList[0]?.name || 'Primary College';

      let successCount = 0;

      for (const item of rollCallList) {
        const payload = {
          student_id: item.student_id,
          student_name: item.student_name,
          class_name: item.class_name,
          college_id: collegeId,
          college_name: collegeName,
          batch_id: setupData.batch_id,
          batch_name: activeBatchObj.name,
          date: setupData.date,
          status: item.status,
          subject: setupData.subject,
          class_type: setupData.class_type,
          period: setupData.period,
          remarks: item.remarks
        };

        if (item.existingId) {
          // Update
          await base44.entities.Attendance.update(item.existingId, {
            ...payload,
            version: item.existingVersion
          });
        } else {
          // Create
          await base44.entities.Attendance.create(payload);
        }
        successCount++;
      }

      triggerToast(`Attendance logs compiled successfully for ${successCount} students.`, 'success');
      setIsRollCallStarted(false);
      setRollCallList([]);
    } catch (err) {
      console.error(err);
      triggerToast(err.message, 'danger');
    }
  };

  // Export reports to Excel-friendly CSV
  const handleExportCsv = () => {
    if (reportLogs.length === 0) {
      triggerToast('No records available to export.', 'warning');
      return;
    }

    const headers = ['Date', 'Student Name', 'Class Name', 'Subject', 'Class Type', 'Period', 'Status', 'Remarks'];
    const rows = reportLogs.map(log => [
      log.date,
      log.student_name,
      log.class_name,
      log.subject,
      log.class_type,
      log.period,
      log.status,
      `"${log.remarks || ''}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Attendance_Report_${setupData.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Report exported as CSV spreadsheet.', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
      
      {/* Tabs Menu */}
      <div className="tabs-container">
        <button className={`tab-btn ${activeTab === 'mark' ? 'active' : ''}`} onClick={() => setActiveTab('mark')}>
          <ClipboardCheck size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Mark Attendance
        </button>
        <button className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
          <Calendar size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Attendance Reports
        </button>
      </div>

      {/* TAB CONTENT: MARK ATTENDANCE */}
      {activeTab === 'mark' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Setup block */}
          {!isRollCallStarted ? (
            <div className="glass-panel" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} style={{ color: 'var(--primary)' }} />
                Initialize Class Attendance Sheet
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Academic Batch / Cohort</label>
                  <select 
                    className="form-input" 
                    value={setupData.batch_id}
                    onChange={(e) => setSetupData(prev => ({ ...prev, batch_id: e.target.value }))}
                  >
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Attendance Date</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={setupData.date}
                      onChange={(e) => setSetupData(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Class Classification Type</label>
                    <select 
                      className="form-input" 
                      value={setupData.class_type}
                      onChange={(e) => setSetupData(prev => ({ ...prev, class_type: e.target.value }))}
                    >
                      {classTypes.map(ct => (
                        <option key={ct.id} value={ct.name}>{ct.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Subject / Course Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={setupData.subject}
                    onChange={(e) => setSetupData(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Period / Lecture Hour</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={setupData.period}
                    onChange={(e) => setSetupData(prev => ({ ...prev, period: e.target.value }))}
                  />
                </div>

                <button 
                  onClick={handleStartRollCall}
                  className="btn btn-primary" 
                  style={{ marginTop: '0.5rem', width: '100%' }}
                >
                  Start Student Roll Call
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            // Roll call sheet view
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Info panel */}
              <div className="glass-panel" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                    {setupData.subject} ({setupData.class_type})
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Date: {setupData.date} &bull; Period: {setupData.period}
                  </p>
                </div>
                
                {/* Bulk Actions */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-secondary" style={{ padding: '0.5rem 0.875rem' }} onClick={() => handleBulkMark('Present')}>
                    Mark All Present
                  </button>
                  <button className="btn btn-secondary" style={{ padding: '0.5rem 0.875rem' }} onClick={() => handleBulkMark('Absent')}>
                    Mark All Absent
                  </button>
                </div>
              </div>

              {/* Attendance Table sheet */}
              <div className="table-container animate-fade-in">
                <table className="table-main">
                  <thead>
                    <tr>
                      <th className="table-th">Roll Number</th>
                      <th className="table-th">Student Name</th>
                      <th className="table-th" style={{ textAlign: 'center' }}>Mark Status</th>
                      <th className="table-th">Incident Remarks / Absence Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rollCallList.map(item => (
                      <tr key={item.student_id} className="table-row">
                        <td className="table-td" style={{ fontWeight: 600, color: 'var(--primary)' }}>{item.roll_number}</td>
                        <td className="table-td" style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.student_name}</td>
                        
                        {/* Selector */}
                        <td className="table-td">
                          <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                            {['Present', 'Absent', 'Late', 'Excused'].map(st => {
                              const isActive = item.status === st;
                              // Single unified className — fixes the duplicate className bug
                              const colorClass = st === 'Present' ? 'badge-success' : st === 'Absent' ? 'badge-danger' : st === 'Late' ? 'badge-warning' : 'badge-info';
                              return (
                                <button
                                  key={st}
                                  onClick={() => handleStatusChange(item.student_id, st)}
                                  className={isActive ? `badge ${colorClass}` : 'btn btn-secondary'}
                                  style={{
                                    padding: '0.35rem 0.75rem',
                                    fontSize: '0.75rem',
                                    borderRadius: '50px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {st}
                                </button>
                              );
                            })}
                          </div>
                        </td>

                        {/* Remarks */}
                        <td className="table-td">
                          <input 
                            type="text" 
                            className="form-input" 
                            style={{ padding: '0.375rem 0.625rem', fontSize: '0.825rem' }}
                            placeholder="e.g. Health leave, medical reason..."
                            value={item.remarks}
                            onChange={(e) => handleRemarksChange(item.student_id, e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <button className="btn btn-secondary" onClick={() => { setIsRollCallStarted(false); setRollCallList([]); }}>
                  Cancel Roster
                </button>
                {hasWriteAccess ? (
                  <button className="btn btn-primary" onClick={handleSubmitAttendance}>
                    <Save size={16} />
                    Submit Attendance Sheet
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', fontSize: '0.8rem', color: 'var(--danger)' }}>
                    <ShieldAlert size={14} />
                    Read-only Access: Cannot Submit Attendance
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      )}

      {/* TAB CONTENT: ATTENDANCE REPORTS */}
      {activeTab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Reports Filter block */}
          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Batch:</span>
              <select 
                className="form-input" 
                style={{ width: '160px', padding: '0.5rem' }}
                value={reportFilter.batch_id}
                onChange={(e) => setReportFilter(prev => ({ ...prev, batch_id: e.target.value }))}
              >
                <option value="All">All Cohorts</option>
                {batches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Date:</span>
              <input 
                type="date" 
                className="form-input" 
                style={{ width: '150px', padding: '0.45rem' }}
                value={reportFilter.date}
                onChange={(e) => setReportFilter(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Subject:</span>
              <select 
                className="form-input" 
                style={{ width: '180px', padding: '0.5rem' }}
                value={reportFilter.subject}
                onChange={(e) => setReportFilter(prev => ({ ...prev, subject: e.target.value }))}
              >
                <option value="All">All Subjects</option>
                {uniqueAttendanceSubjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            <button className="btn btn-secondary" style={{ marginLeft: 'auto' }} onClick={handleExportCsv}>
              <Download size={16} />
              Export Report (CSV)
            </button>
          </div>

          {/* Roster logs table */}
          <div className="table-container">
            <table className="table-main">
              <thead>
                <tr>
                  <th className="table-th">Date</th>
                  <th className="table-th">Student Name</th>
                  <th className="table-th">Class Name</th>
                  <th className="table-th">Subject</th>
                  <th className="table-th">Class Type</th>
                  <th className="table-th">Period</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {reportLogs.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="table-td" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No attendance matching logs found for the selected query.
                    </td>
                  </tr>
                ) : (
                  reportLogs.map(log => (
                    <tr key={log.id} className="table-row">
                      <td className="table-td" style={{ fontWeight: 600 }}>{log.date}</td>
                      <td className="table-td" style={{ fontWeight: 600, color: 'var(--text-main)' }}>{log.student_name}</td>
                      <td className="table-td">{log.class_name}</td>
                      <td className="table-td">{log.subject}</td>
                      <td className="table-td">{log.class_type}</td>
                      <td className="table-td">{log.period}</td>
                      <td className="table-td">
                        <span className={`badge ${
                          log.status === 'Present' ? 'badge-success' : 
                          log.status === 'Absent' ? 'badge-danger' : 
                          log.status === 'Late' ? 'badge-warning' : 'badge-info'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="table-td" style={{ fontStyle: 'italic', fontSize: '0.8rem' }}>{log.remarks || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

    </div>
  );
};

export default AttendanceView;
