// Academia Flow ERP - Examination & Evaluation Module
import React, { useState, useEffect } from 'react';
import { base44 } from '../api/base44Client';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { FileSpreadsheet, GraduationCap, Users, ShieldAlert, Save, Printer, Award, ArrowRight } from 'lucide-react';

const ExaminationView = () => {
  const { hasWriteAccess } = useAuth();
  const { triggerToast } = useNotifications();

  // Collections
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [college, setCollege] = useState(null);

  // Tab State
  const [activeTab, setActiveTab] = useState('entry');

  // Search setups
  const [setupData, setSetupData] = useState({
    batch_id: '',
    semester: 'Semester 3',
    subject: 'Systemic Pathology',
    exam_name: 'Mid-term evaluation',
    exam_date: new Date().toISOString().split('T')[0]
  });

  const [isGridStarted, setIsGridStarted] = useState(false);
  const [gradeList, setGradeList] = useState([]); // Array of student exam entries

  // Marksheet Tab state
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedStudentExam, setSelectedStudentExam] = useState(null);

  const loadData = async () => {
    try {
      const batchList = await base44.entities.Batch.list();
      const studentList = await base44.entities.Student.list();
      const colList = await base44.entities.College.list();

      setBatches(batchList);
      setStudents(studentList);
      if (colList.length > 0) setCollege(colList[0]);

      if (batchList.length > 0) {
        setSetupData(prev => ({ ...prev, batch_id: batchList[0].id }));
      }
      if (studentList.length > 0) {
        setSelectedStudentId(studentList[0].id);
      }
    } catch (err) {
      console.error(err);
      triggerToast('Failed to load classes or student directory.', 'danger');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Recalculate letters grades based on passing marks
  const calculateGrade = (totalMarks) => {
    const passThreshold = college?.passing_marks ?? 60;
    
    if (totalMarks < passThreshold) return 'F';
    if (totalMarks >= 90) return 'A+';
    if (totalMarks >= 80) return 'A';
    if (totalMarks >= 75) return 'B+';
    if (totalMarks >= 70) return 'B';
    return 'C';
  };

  const handleStartGradeRegistry = async () => {
    const activeBatch = batches.find(b => b.id === setupData.batch_id);
    if (!activeBatch) {
      triggerToast('Please select a valid cohort batch.', 'warning');
      return;
    }

    try {
      // Find students enrolled in batch
      const batchStudents = students.filter(s => s.batch_id === setupData.batch_id && s.status === 'Active');
      if (batchStudents.length === 0) {
        triggerToast('No active students registered under this cohort batch.', 'warning');
        return;
      }

      // Check for existing compilation logs
      const existingLogs = await base44.entities.Examination.filter({
        batch_id: setupData.batch_id,
        semester: setupData.semester,
        exam_name: setupData.exam_name,
        subject: setupData.subject
      });

      const initialGrades = batchStudents.map(student => {
        const logged = existingLogs.find(l => l.student_id === student.id);
        
        const midVal = logged ? logged.mid_term_marks : 0;
        const ospVal = logged ? logged.ospe_marks : 0;
        const semVal = logged ? logged.sem_marks : 0;
        const total = midVal + ospVal + semVal;

        return {
          student_id: student.id,
          student_name: student.full_name,
          roll_number: student.roll_number,
          class_name: student.class_name,
          mid_term_marks: midVal,
          ospe_marks: ospVal,
          sem_marks: semVal,
          marks_obtained: total,
          grade: calculateGrade(total),
          
          // Behavior points
          cleanliness_grade: logged ? logged.cleanliness_grade : 'A',
          behaviour_grade: logged ? logged.behaviour_grade : 'A',
          presentation_grade: logged ? logged.presentation_grade : 'A',
          sports_grade: logged ? logged.sports_grade : 'B',
          
          // Attendance variables
          total_classes: logged ? logged.total_classes : 40,
          total_absentees: logged ? logged.total_absentees : 0,
          total_dormitory_absence: logged ? logged.total_dormitory_absence : 0,
          remarks: logged ? logged.remarks : '',
          
          existingId: logged ? logged.id : null,
          existingVersion: logged ? logged.version : null
        };
      });

      setGradeList(initialGrades);
      setIsGridStarted(true);
      triggerToast('Compilation sheet loaded successfully.', 'info');
    } catch (err) {
      console.error(err);
      triggerToast('Failed to retrieve grading histories.', 'danger');
    }
  };

  const handleCellChange = (studentId, field, value) => {
    setGradeList(prev => prev.map(item => {
      if (item.student_id === studentId) {
        let updatedVal = value;
        
        // Handle numeric weights limits
        if (field === 'mid_term_marks') {
          updatedVal = Math.min(Math.max(Number(value) || 0, 0), 30); // Max 30
        } else if (field === 'ospe_marks') {
          updatedVal = Math.min(Math.max(Number(value) || 0, 0), 20); // Max 20
        } else if (field === 'sem_marks') {
          updatedVal = Math.min(Math.max(Number(value) || 0, 0), 50); // Max 50
        } else if (field === 'total_classes' || field === 'total_absentees' || field === 'total_dormitory_absence') {
          updatedVal = Math.max(Number(value) || 0, 0);
        }

        const nextItem = { ...item, [field]: updatedVal };
        
        // Re-calc sum
        if (field === 'mid_term_marks' || field === 'ospe_marks' || field === 'sem_marks') {
          nextItem.marks_obtained = nextItem.mid_term_marks + nextItem.ospe_marks + nextItem.sem_marks;
          nextItem.grade = calculateGrade(nextItem.marks_obtained);
        }

        return nextItem;
      }
      return item;
    }));
  };

  const handleSubmitGrades = async () => {
    if (!hasWriteAccess) {
      triggerToast('Permission Denied: Only Admins/Teachers can submit grades.', 'danger');
      return;
    }

    try {
      const activeBatchObj = batches.find(b => b.id === setupData.batch_id);
      let successCount = 0;

      for (const item of gradeList) {
        const payload = {
          student_id: item.student_id,
          student_name: item.student_name,
          class_name: item.class_name,
          college_id: college?.id || 'col_primary',
          college_name: college?.name || 'Primary College',
          batch_id: setupData.batch_id,
          batch_name: activeBatchObj.name,
          
          semester: setupData.semester,
          exam_name: setupData.exam_name,
          subject: setupData.subject,
          exam_date: setupData.exam_date,

          mid_term_marks: item.mid_term_marks,
          ospe_marks: item.ospe_marks,
          sem_marks: item.sem_marks,
          marks_obtained: item.marks_obtained,
          max_marks: college?.total_marks || 100,
          full_marks: 'CA: 30, OSPE: 20, Written: 50',
          grade: item.grade,

          cleanliness_grade: item.cleanliness_grade,
          behaviour_grade: item.behaviour_grade,
          presentation_grade: item.presentation_grade,
          sports_grade: item.sports_grade,

          total_classes: item.total_classes,
          total_absentees: item.total_absentees,
          total_dormitory_absence: item.total_dormitory_absence,
          remarks: item.remarks
        };

        if (item.existingId) {
          await base44.entities.Examination.update(item.existingId, {
            ...payload,
            version: item.existingVersion
          });
        } else {
          await base44.entities.Examination.create(payload);
        }
        successCount++;
      }

      triggerToast(`Evaluation spreadsheet recorded successfully for ${successCount} students.`, 'success');
      setIsGridStarted(false);
      setGradeList([]);
    } catch (err) {
      console.error(err);
      triggerToast(err.message, 'danger');
    }
  };

  // Marksheet Loader
  const handleLoadStudentMarksheet = async () => {
    if (!selectedStudentId) return;
    try {
      const records = await base44.entities.Examination.filter({ student_id: selectedStudentId });
      if (records.length > 0) {
        setSelectedStudentExam(records[0]); // load latest record
        triggerToast('Student marksheet loaded successfully.', 'info');
      } else {
        setSelectedStudentExam(null);
        triggerToast('No grade compile sheet compiles for this student.', 'warning');
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'marksheet' && selectedStudentId) {
      handleLoadStudentMarksheet();
    }
  }, [activeTab, selectedStudentId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
      
      {/* Tabs Menu */}
      <div className="tabs-container no-print">
        <button className={`tab-btn ${activeTab === 'entry' ? 'active' : ''}`} onClick={() => setActiveTab('entry')}>
          <FileSpreadsheet size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Enter Grades & Marks
        </button>
        <button className={`tab-btn ${activeTab === 'marksheet' ? 'active' : ''}`} onClick={() => setActiveTab('marksheet')}>
          <GraduationCap size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Institution Marksheets
        </button>
      </div>

      {/* TAB CONTENT: ENTER GRADES */}
      {activeTab === 'entry' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Setup block */}
          {!isGridStarted ? (
            <div className="glass-panel" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={20} style={{ color: 'var(--primary)' }} />
                Open Examination Sheet
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
                    <label className="form-label">Semester Block</label>
                    <select 
                      className="form-input" 
                      value={setupData.semester}
                      onChange={(e) => setSetupData(prev => ({ ...prev, semester: e.target.value }))}
                    >
                      <option value="Semester 1">Semester 1</option>
                      <option value="Semester 2">Semester 2</option>
                      <option value="Semester 3">Semester 3</option>
                      <option value="Semester 4">Semester 4</option>
                      <option value="Semester 5">Semester 5</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Evaluation Date</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={setupData.exam_date}
                      onChange={(e) => setSetupData(prev => ({ ...prev, exam_date: e.target.value }))}
                    />
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
                  <label className="form-label">Exam Title (e.g. Mid-term assessment)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={setupData.exam_name}
                    onChange={(e) => setSetupData(prev => ({ ...prev, exam_name: e.target.value }))}
                  />
                </div>

                <button 
                  onClick={handleStartGradeRegistry}
                  className="btn btn-primary" 
                  style={{ marginTop: '0.5rem', width: '100%' }}
                >
                  Load Grade Evaluation Sheet
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            // Grade Compilation Sheet
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div className="glass-panel" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                    {setupData.subject} &bull; {setupData.exam_name}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Semester: {setupData.semester} &bull; Date: {setupData.exam_date}
                  </p>
                </div>
                <div style={{ fontSize: '0.75rem', background: 'var(--primary-glow)', padding: '0.5rem 1rem', borderRadius: '6px', color: 'var(--primary)' }}>
                  Passing Threshold: <strong>{college?.passing_marks}%</strong>
                </div>
              </div>

              {/* Spreadsheet Grid container */}
              <div className="table-container" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                <table className="table-main" style={{ minWidth: '1100px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.015)' }}>
                      <th className="table-th" style={{ width: '120px' }}>Roll Number</th>
                      <th className="table-th" style={{ width: '180px' }}>Student Name</th>
                      <th className="table-th" style={{ textAlign: 'center', width: '80px' }}>Mid-CA (30)</th>
                      <th className="table-th" style={{ textAlign: 'center', width: '80px' }}>OSPE (20)</th>
                      <th className="table-th" style={{ textAlign: 'center', width: '80px' }}>Theory (50)</th>
                      <th className="table-th" style={{ textAlign: 'center', width: '80px' }}>Total (100)</th>
                      <th className="table-th" style={{ textAlign: 'center', width: '70px' }}>Grade</th>
                      <th className="table-th" style={{ textAlign: 'center', width: '60px' }}>Hygiene</th>
                      <th className="table-th" style={{ textAlign: 'center', width: '60px' }}>Behavior</th>
                      <th className="table-th" style={{ textAlign: 'center', width: '60px' }}>Comm</th>
                      <th className="table-th" style={{ textAlign: 'center', width: '60px' }}>Sports</th>
                      <th className="table-th" style={{ width: '220px' }}>Teacher Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gradeList.map(item => (
                      <tr key={item.student_id} className="table-row">
                        <td className="table-td" style={{ fontWeight: 600, color: 'var(--primary)' }}>{item.roll_number}</td>
                        <td className="table-td" style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.student_name}</td>
                        
                        {/* Mid-term */}
                        <td className="table-td" style={{ padding: '0.25rem' }}>
                          <input 
                            type="number" 
                            className="form-input" 
                            style={{ textAlign: 'center', padding: '0.35rem' }} 
                            value={item.mid_term_marks}
                            onChange={(e) => handleCellChange(item.student_id, 'mid_term_marks', e.target.value)}
                          />
                        </td>
                        
                        {/* OSPE */}
                        <td className="table-td" style={{ padding: '0.25rem' }}>
                          <input 
                            type="number" 
                            className="form-input" 
                            style={{ textAlign: 'center', padding: '0.35rem' }} 
                            value={item.ospe_marks}
                            onChange={(e) => handleCellChange(item.student_id, 'ospe_marks', e.target.value)}
                          />
                        </td>

                        {/* Theory */}
                        <td className="table-td" style={{ padding: '0.25rem' }}>
                          <input 
                            type="number" 
                            className="form-input" 
                            style={{ textAlign: 'center', padding: '0.35rem' }} 
                            value={item.sem_marks}
                            onChange={(e) => handleCellChange(item.student_id, 'sem_marks', e.target.value)}
                          />
                        </td>

                        {/* Calculated Total */}
                        <td className="table-td" style={{ textAlign: 'center', fontWeight: 'bold', color: item.marks_obtained >= (college?.passing_marks ?? 60) ? 'var(--success)' : 'var(--danger)' }}>
                          {item.marks_obtained}
                        </td>

                        {/* Calculated Grade */}
                        <td className="table-td" style={{ textAlign: 'center' }}>
                          <span className={`badge ${item.grade === 'F' ? 'badge-danger' : 'badge-success'}`} style={{ fontWeight: 'bold' }}>
                            {item.grade}
                          </span>
                        </td>

                        {/* Hygiene Grade */}
                        <td className="table-td" style={{ padding: '0.25rem' }}>
                          <select className="form-input" style={{ padding: '0.35rem' }} value={item.cleanliness_grade} onChange={(e) => handleCellChange(item.student_id, 'cleanliness_grade', e.target.value)}>
                            <option value="A+">A+</option><option value="A">A</option><option value="B">B</option><option value="C">C</option>
                          </select>
                        </td>

                        {/* Behavior Grade */}
                        <td className="table-td" style={{ padding: '0.25rem' }}>
                          <select className="form-input" style={{ padding: '0.35rem' }} value={item.behaviour_grade} onChange={(e) => handleCellChange(item.student_id, 'behaviour_grade', e.target.value)}>
                            <option value="A+">A+</option><option value="A">A</option><option value="B">B</option><option value="C">C</option>
                          </select>
                        </td>

                        {/* Comm Grade */}
                        <td className="table-td" style={{ padding: '0.25rem' }}>
                          <select className="form-input" style={{ padding: '0.35rem' }} value={item.presentation_grade} onChange={(e) => handleCellChange(item.student_id, 'presentation_grade', e.target.value)}>
                            <option value="A+">A+</option><option value="A">A</option><option value="B">B</option><option value="C">C</option>
                          </select>
                        </td>

                        {/* Sports Grade */}
                        <td className="table-td" style={{ padding: '0.25rem' }}>
                          <select className="form-input" style={{ padding: '0.35rem' }} value={item.sports_grade} onChange={(e) => handleCellChange(item.student_id, 'sports_grade', e.target.value)}>
                            <option value="A+">A+</option><option value="A">A</option><option value="B">B</option><option value="C">C</option>
                          </select>
                        </td>

                        {/* Remarks */}
                        <td className="table-td" style={{ padding: '0.25rem' }}>
                          <input 
                            type="text" 
                            className="form-input" 
                            style={{ padding: '0.35rem' }} 
                            placeholder="Observations..."
                            value={item.remarks}
                            onChange={(e) => handleCellChange(item.student_id, 'remarks', e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <button className="btn btn-secondary" onClick={() => { setIsGridStarted(false); setGradeList([]); }}>
                  Cancel Sheet
                </button>
                {hasWriteAccess ? (
                  <button className="btn btn-primary" onClick={handleSubmitGrades}>
                    <Save size={16} />
                    Submit & Save Grades
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', fontSize: '0.8rem', color: 'var(--danger)' }}>
                    <ShieldAlert size={14} />
                    Read-only Access: Cannot Submit Grades
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      )}

      {/* TAB CONTENT: INSTITUTION MARKSHEETS */}
      {activeTab === 'marksheet' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Search bar selector */}
          <div className="glass-panel no-print" style={{ padding: '1.25rem', display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Select Student:</span>
              <select 
                className="form-input" 
                style={{ width: '260px', padding: '0.5rem' }}
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.full_name} ({s.roll_number})</option>
                ))}
              </select>
            </div>
            
            {selectedStudentExam && (
              <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => window.print()}>
                <Printer size={16} />
                Print Marksheet Card
              </button>
            )}
          </div>

          {/* Marksheet Report view */}
          {selectedStudentExam ? (
            <div className="glass-panel" style={{ padding: '2.5rem', background: 'white', color: 'black', border: '1px solid #ddd', boxShadow: 'none' }}>
              
              {/* Institutional letterhead */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '2px solid black', paddingBottom: '1rem', marginBottom: '2rem', textAlign: 'center' }}>
                <img 
                  src={college?.logo_url || "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=120&h=120&q=80"} 
                  alt="Logo" 
                  style={{ height: '70px', marginBottom: '0.5rem' }}
                />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {college?.name || 'Aegis Institute of Medical Sciences'}
                </h2>
                <p style={{ fontSize: '0.8rem', margin: '0.125rem 0' }}>
                  {college?.address} &bull; Email: {college?.email} &bull; Phone: {college?.phone}
                </p>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', textTransform: 'uppercase', border: '1px solid black', padding: '0.25rem 1rem', marginTop: '1rem', display: 'inline-block' }}>
                  OFFICIAL MARKSHEET & TRANSCRIPT
                </h3>
              </div>

              {/* Student info mapping */}
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '2rem', fontSize: '0.9rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div>Name of Student: <strong>{selectedStudentExam.student_name}</strong></div>
                  <div>Roll Number: <strong>{selectedStudentExam.roll_number}</strong></div>
                  <div>Class / Section: <strong>{selectedStudentExam.class_name}</strong></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div>Semester: <strong>{selectedStudentExam.semester}</strong></div>
                  <div>Evaluation: <strong>{selectedStudentExam.exam_name}</strong></div>
                  <div>Subject/Course: <strong>{selectedStudentExam.subject}</strong></div>
                </div>
              </div>

              {/* Marks Grid */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', marginBottom: '2rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid black', borderTop: '2px solid black', background: '#f8f9fa' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Evaluation Segment</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', width: '140px' }}>Marks Obtained</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', width: '140px' }}>Maximum Weight</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '0.75rem' }}>Continuous Assessment (CA)</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>{selectedStudentExam.mid_term_marks ?? '-'}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>30</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '0.75rem' }}>Objective Structured Practical Exam (OSPE)</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>{selectedStudentExam.ospe_marks ?? '-'}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>20</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '0.75rem' }}>Semester written final examination</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>{selectedStudentExam.sem_marks ?? '-'}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>50</td>
                  </tr>
                  <tr style={{ borderBottom: '2px solid black', fontWeight: 'bold', background: '#f1f3f5' }}>
                    <td style={{ padding: '0.75rem' }}>TOTAL ACCUMULATED SCORE</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>{selectedStudentExam.marks_obtained}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>100</td>
                  </tr>
                </tbody>
              </table>

              {/* Behavior & attendance values */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', fontSize: '0.85rem', marginBottom: '2rem', borderBottom: '1px solid #ddd', paddingBottom: '1.25rem' }}>
                <div>
                  <span style={{ color: '#666', display: 'block', fontSize: '0.75rem' }}>LETTER GRADE</span>
                  <strong>{selectedStudentExam.grade}</strong>
                </div>
                <div>
                  <span style={{ color: '#666', display: 'block', fontSize: '0.75rem' }}>CLEANLINESS</span>
                  <strong>{selectedStudentExam.cleanliness_grade || 'A'}</strong>
                </div>
                <div>
                  <span style={{ color: '#666', display: 'block', fontSize: '0.75rem' }}>CONDUCT BEHAVIOR</span>
                  <strong>{selectedStudentExam.behaviour_grade || 'A'}</strong>
                </div>
                <div>
                  <span style={{ color: '#666', display: 'block', fontSize: '0.75rem' }}>ATTENDANCE RATE</span>
                  <strong>
                    {selectedStudentExam.total_classes ? Math.round(((selectedStudentExam.total_classes - selectedStudentExam.total_absentees) / selectedStudentExam.total_classes) * 100) : 100}%
                  </strong>
                </div>
              </div>

              {/* Remarks */}
              <div style={{ fontSize: '0.85rem', marginBottom: '4rem' }}>
                <span style={{ color: '#666' }}>Academic Remarks / Recommendations:</span>
                <p style={{ margin: '0.25rem 0 0 0', fontStyle: 'italic' }}>
                  "{selectedStudentExam.remarks || 'Student demonstrates strong academic capability.'}"
                </p>
              </div>

              {/* Signatures */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', textAlign: 'center', fontSize: '0.85rem' }}>
                <div>
                  <div style={{ height: '40px' }}></div>
                  <div style={{ borderTop: '1px solid black', width: '200px', margin: '0 auto', paddingTop: '0.25rem' }}>
                    Academic Registrar
                  </div>
                </div>
                <div>
                  <div style={{ height: '40px', fontStyle: 'italic', fontWeight: 'bold', display: 'flex', alignItems: 'end', justifyContent: 'center' }}>
                    {college?.dean_name || 'Dr. Arthur Pendelton'}
                  </div>
                  <div style={{ borderTop: '1px solid black', width: '200px', margin: '0 auto', paddingTop: '0.25rem' }}>
                    {college?.dean_title || 'Dean International Department'}
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Select a student to inspect or print their Compiled Academic Grade Marksheet.
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default ExaminationView;
