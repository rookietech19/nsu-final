// Academia Flow ERP - Student Profile Details View
import React, { useState, useEffect } from 'react';
import { base44 } from '../api/base44Client';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { 
  ArrowLeft, 
  User, 
  FileText, 
  Calendar, 
  GraduationCap, 
  HeartHandshake, 
  Printer, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldAlert, 
  AlertCircle 
} from 'lucide-react';

const StudentProfileDetailView = ({ studentId, setActiveView }) => {
  const { triggerToast } = useNotifications();
  const [student, setStudent] = useState(null);
  const [college, setCollege] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Loaded logs
  const [attendance, setAttendance] = useState([]);
  const [exams, setExams] = useState([]);
  const [behaviors, setBehaviors] = useState([]);

  // Attendance metrics
  const [attendanceRate, setAttendanceRate] = useState(100);
  const [attendanceBreakdown, setAttendanceBreakdown] = useState({ present: 0, absent: 0, late: 0, excused: 0 });

  const loadStudentDetails = async () => {
    if (!studentId) return;
    try {
      // Load student
      const studentList = await base44.entities.Student.list();
      const current = studentList.find(s => s.id === studentId);
      if (!current) {
        triggerToast('Student record not found.', 'danger');
        setActiveView('students');
        return;
      }
      setStudent(current);

      // Load College settings for thresholds
      const colList = await base44.entities.College.list();
      if (colList.length > 0) {
        setCollege(colList[0]);
      }

      // Load sub-logs
      const attList = await base44.entities.Attendance.filter({ student_id: studentId });
      const examList = await base44.entities.Examination.filter({ student_id: studentId });
      const behList = await base44.entities.BehaviourRecord.filter({ student_id: studentId });

      setAttendance(attList);
      setExams(examList);
      setBehaviors(behList);

      // Calculate attendance metrics
      if (attList.length > 0) {
        const pres = attList.filter(a => a.status === 'Present').length;
        const abs = attList.filter(a => a.status === 'Absent').length;
        const lat = attList.filter(a => a.status === 'Late').length;
        const exc = attList.filter(a => a.status === 'Excused').length;
        
        const rate = Math.round(((pres + lat + exc) / attList.length) * 100);
        setAttendanceRate(rate);
        setAttendanceBreakdown({ present: pres, absent: abs, late: lat, excused: exc });
      }

    } catch (err) {
      console.error(err);
      triggerToast('Error loading student profile data.', 'danger');
    }
  };

  useEffect(() => {
    loadStudentDetails();
  }, [studentId]);

  if (!student) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Retrieving student profile details...</div>;
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
      
      {/* Back navigation & print */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button 
          onClick={() => setActiveView('students')}
          className="btn btn-secondary"
          style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
        >
          <ArrowLeft size={16} />
          Back to Directory
        </button>
        <button 
          onClick={handlePrint}
          className="btn btn-primary"
          style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
        >
          <Printer size={16} />
          Print / Save PDF
        </button>
      </div>

      {/* Printable Letterhead wrapper */}
      <div className="print-letterhead print-only" style={{ display: 'none' }}>
        <img src={college?.logo_url || "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=120&h=120&q=80"} alt="Logo" />
        <h1>{college?.name || 'Aegis Institute of Medical Sciences'}</h1>
        <p>{college?.address} &bull; {college?.phone} &bull; {college?.email}</p>
        <p style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 'bold', marginTop: '0.5rem', fontSize: '12pt' }}>
          Official Academic Record
        </p>
      </div>

      {/* Main Student Header Card */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <img 
          src={student.photo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${student.full_name}`} 
          alt={student.full_name} 
          style={{
            width: '100px',
            height: '100px',
            borderRadius: '16px',
            objectFit: 'cover',
            border: '2px solid var(--primary-glow)'
          }}
        />
        <div style={{ flex: 1, minWidth: '240px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, fontFamily: 'var(--font-title)' }}>{student.full_name}</h2>
            <span className={`badge ${student.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
              {student.status}
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.25rem 0' }}>
            Roll Number: <strong>{student.roll_number}</strong> &bull; Dept: {student.department}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
            {student.class_name} &bull; {student.batch_name}
          </p>
        </div>

        {/* Dynamic GPA/Attendance quick preview */}
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <div style={{ textAlign: 'center', background: 'var(--success-glow)', padding: '0.75rem 1.25rem', borderRadius: '12px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>ATTENDANCE</span>
            <h4 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)', margin: 0 }}>{attendanceRate}%</h4>
          </div>
          <div style={{ textAlign: 'center', background: 'var(--primary-glow)', padding: '0.75rem 1.25rem', borderRadius: '12px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>GPA (SEM 3)</span>
            <h4 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
              {exams.length > 0 ? (exams[0].grade === 'F' ? 'FAIL' : exams[0].grade) : 'N/A'}
            </h4>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="tabs-container no-print">
        <button className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <User size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Personal Details
        </button>
        <button className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`} onClick={() => setActiveTab('documents')}>
          <FileText size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Documents Preview
        </button>
        <button className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => setActiveTab('attendance')}>
          <Calendar size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Attendance History
        </button>
        <button className={`tab-btn ${activeTab === 'transcript' ? 'active' : ''}`} onClick={() => setActiveTab('transcript')}>
          <GraduationCap size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Grade Transcript
        </button>
        <button className={`tab-btn ${activeTab === 'behavior' ? 'active' : ''}`} onClick={() => setActiveTab('behavior')}>
          <HeartHandshake size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Behavior Portfolio
        </button>
      </div>

      {/* TAB CONTENT */}

      {/* Tab 1: Personal Details */}
      {true && (
        <div className={`glass-panel ${activeTab !== 'profile' ? 'print-only' : ''}`} style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', color: 'var(--primary)' }}>
            Personal Profile & Emergency Contact
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            {/* Left: General */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Date of Birth</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{student.date_of_birth || 'N/A'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <User size={16} style={{ color: 'var(--text-muted)' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gender Identity</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{student.gender || 'N/A'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Mail size={16} style={{ color: 'var(--text-muted)' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Institutional Email</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{student.email || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Middle: Contact */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Phone size={16} style={{ color: 'var(--text-muted)' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Contact Phone</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{student.phone || 'N/A'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <MapPin size={16} style={{ color: 'var(--text-muted)' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Residential Address</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{student.address || 'N/A'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Admission Enrollment Date</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{student.admission_date || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Right: Emergency/Guardian */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0,0,0,0.01)', padding: '1rem', borderRadius: '10px', border: '1px dashed var(--border-color)' }}>
              <h4 style={{ fontSize: '0.85rem', margin: 0, fontWeight: 700 }}>Guardian Emergency Contact</h4>
              
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Guardian Name</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{student.guardian_name || 'N/A'}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Emergency Phone</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)' }}>{student.guardian_phone || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Documents */}
      {activeTab === 'documents' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', color: 'var(--primary)' }}>
            Uploaded Identity & Medical Certificates
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {/* Document 1: Scanned Passport */}
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--card-bg)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Passport Scan / ID Card</div>
              <div style={{
                height: '140px',
                borderRadius: '6px',
                background: 'rgba(0,0,0,0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
                border: '1px dashed var(--border-color)',
                overflow: 'hidden'
              }}>
                {student.passport_url ? (
                  <img src={student.passport_url} alt="Passport Scan" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span>No passport file uploaded.</span>
                )}
              </div>
            </div>

            {/* Document 2+: Custom other documents */}
            {student.other_documents && student.other_documents.map((doc, idx) => (
              <div key={idx} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--card-bg)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{doc.name}</div>
                <div style={{
                  height: '140px',
                  borderRadius: '6px',
                  background: 'rgba(0,0,0,0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.8rem',
                  border: '1px dashed var(--border-color)'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <FileText size={32} style={{ color: 'var(--primary)', marginBottom: '0.5rem', opacity: 0.6 }} />
                    <div>Document Registered</div>
                    <span style={{ fontSize: '0.65rem' }}>Link Available</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Upload placeholder */}
            <div style={{ border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '190px' }}>
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                <AlertCircle size={24} style={{ margin: '0 auto 0.5rem auto' }} />
                <span>Upload New Document</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Attendance History */}
      {activeTab === 'attendance' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', color: 'var(--primary)' }}>
            Attendance Performance Logs
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.01)', border: '1px solid var(--border-color)', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>CLASSES PRESENT</div>
              <h4 style={{ fontSize: '1.75rem', color: 'var(--success)', margin: '0.25rem 0', fontWeight: 800 }}>{attendanceBreakdown.present}</h4>
            </div>
            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.01)', border: '1px solid var(--border-color)', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>ABSENT SESSIONS</div>
              <h4 style={{ fontSize: '1.75rem', color: 'var(--danger)', margin: '0.25rem 0', fontWeight: 800 }}>{attendanceBreakdown.absent}</h4>
            </div>
            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.01)', border: '1px solid var(--border-color)', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>LATE ENTRIES</div>
              <h4 style={{ fontSize: '1.75rem', color: 'var(--warning)', margin: '0.25rem 0', fontWeight: 800 }}>{attendanceBreakdown.late}</h4>
            </div>
            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.01)', border: '1px solid var(--border-color)', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>EXCUSED LEAVE</div>
              <h4 style={{ fontSize: '1.75rem', color: 'var(--info)', margin: '0.25rem 0', fontWeight: 800 }}>{attendanceBreakdown.excused}</h4>
            </div>
          </div>

          <div className="table-container">
            <table className="table-main">
              <thead>
                <tr>
                  <th className="table-th">Date</th>
                  <th className="table-th">Subject / Course</th>
                  <th className="table-th">Class Type</th>
                  <th className="table-th">Time/Period</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {attendance.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="table-td" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No attendance instances registered.
                    </td>
                  </tr>
                ) : (
                  attendance.map(att => (
                    <tr key={att.id} className="table-row">
                      <td className="table-td" style={{ fontWeight: 600 }}>{att.date}</td>
                      <td className="table-td">{att.subject}</td>
                      <td className="table-td">{att.class_type}</td>
                      <td className="table-td">{att.period}</td>
                      <td className="table-td">
                        <span className={`badge ${
                          att.status === 'Present' ? 'badge-success' : 
                          att.status === 'Absent' ? 'badge-danger' : 
                          att.status === 'Late' ? 'badge-warning' : 'badge-info'
                        }`}>
                          {att.status}
                        </span>
                      </td>
                      <td className="table-td" style={{ fontStyle: 'italic', fontSize: '0.8rem' }}>{att.remarks || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Grade Transcript */}
      {true && (
        <div className={`glass-panel ${activeTab !== 'transcript' ? 'print-only' : ''}`} style={{ padding: '2rem' }}>
          
          {/* Header Title */}
          <div style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
              Academic Performance Transcript
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Official Record</span>
          </div>

          {exams.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>No examination results compiled yet.</p>
          ) : (
            exams.map(exam => {
              const isPass = exam.marks_obtained >= (college?.passing_marks ?? 60);
              
              return (
                <div key={exam.id} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', pageBreakInside: 'avoid', marginBottom: '2rem' }}>
                  
                  {/* Exam details grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                    <div>
                      <div>Evaluation Block: <strong>{exam.exam_name}</strong></div>
                      <div>Subject: <strong>{exam.subject}</strong></div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div>Semester: <strong>{exam.semester}</strong></div>
                      <div>Date Evaluated: <strong>{exam.exam_date || 'N/A'}</strong></div>
                    </div>
                  </div>

                  {/* Marks Breakdown Table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-color)', background: 'rgba(0,0,0,0.01)' }}>
                        <th style={{ padding: '0.625rem', textAlign: 'left' }}>Evaluation Component</th>
                        <th style={{ padding: '0.625rem', textAlign: 'center' }}>Marks Obtained</th>
                        <th style={{ padding: '0.625rem', textAlign: 'center' }}>Weightage Limit</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.625rem' }}>Continuous Assessment (CA / Mid-Term)</td>
                        <td style={{ padding: '0.625rem', textAlign: 'center' }}>{exam.mid_term_marks ?? '-'}</td>
                        <td style={{ padding: '0.625rem', textAlign: 'center' }}>30</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.625rem' }}>Objective Structured Practical Exam (OSPE)</td>
                        <td style={{ padding: '0.625rem', textAlign: 'center' }}>{exam.ospe_marks ?? '-'}</td>
                        <td style={{ padding: '0.625rem', textAlign: 'center' }}>20</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.625rem' }}>Semester Theory Examination</td>
                        <td style={{ padding: '0.625rem', textAlign: 'center' }}>{exam.sem_marks ?? '-'}</td>
                        <td style={{ padding: '0.625rem', textAlign: 'center' }}>50</td>
                      </tr>
                      {/* Total */}
                      <tr style={{ borderBottom: '2px solid var(--border-color)', fontWeight: 'bold', background: 'rgba(0,0,0,0.02)' }}>
                        <td style={{ padding: '0.75rem' }}>Cumulative Marks Summary</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center', color: isPass ? 'var(--success)' : 'var(--danger)' }}>
                          {exam.marks_obtained}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>{exam.max_marks || 100}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Grades and conduct cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', margin: '0.5rem 0' }}>
                    <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>LETTER GRADE</span>
                      <strong style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>{exam.grade || 'N/A'}</strong>
                    </div>
                    <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>CLEANLINESS & HYGIENE</span>
                      <strong style={{ fontSize: '1.2rem' }}>{exam.cleanliness_grade || 'A'}</strong>
                    </div>
                    <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>CONDUCT BEHAVIOR</span>
                      <strong style={{ fontSize: '1.2rem' }}>{exam.behaviour_grade || 'A'}</strong>
                    </div>
                    <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>CLASSROOM ATTENDANCE RATE</span>
                      <strong style={{ fontSize: '1.2rem' }}>
                        {exam.total_classes ? Math.round(((exam.total_classes - (exam.total_absentees || 0)) / exam.total_classes) * 100) : 100}%
                      </strong>
                    </div>
                  </div>

                  {/* Remarks & Signatures */}
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Evaluator Observations:</div>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                      "{exam.remarks || 'No academic remarks provided.'}"
                    </p>
                  </div>

                </div>
              );
            })
          )}

          {/* Printable Signatures Grid */}
          <div className="print-signature-grid print-only" style={{ display: 'none' }}>
            <div>
              <div style={{ height: '50px' }}></div> {/* Blank signature space */}
              <div className="print-signature-line">Academic Registrar</div>
            </div>
            <div>
              <div style={{ height: '50px', fontSize: '10pt', fontStyle: 'italic', display: 'flex', alignItems: 'end', justifyContent: 'center' }}>
                {college?.dean_name || 'Dr. Arthur Pendelton'}
              </div>
              <div className="print-signature-line">{college?.dean_title || 'Dean of Medical Faculty'}</div>
            </div>
          </div>

        </div>
      )}

      {/* Tab 5: Behavior Portfolio */}
      {activeTab === 'behavior' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', color: 'var(--primary)' }}>
            Behavior and Student Conduct Portfolio
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {behaviors.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>No behavioral incidents registered for this student.</p>
            ) : (
              behaviors.map(incident => (
                <div 
                  key={incident.id}
                  style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    background: incident.type === 'Negative' ? 'var(--danger-glow)' : incident.type === 'Positive' ? 'var(--success-glow)' : 'rgba(0,0,0,0.01)',
                    borderLeft: `4px solid ${
                      incident.type === 'Negative' ? 'var(--danger)' : 
                      incident.type === 'Positive' ? 'var(--success)' : 'var(--text-muted)'
                    }`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                      {incident.category} &bull; {incident.type} Record
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{incident.date}</span>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {incident.description}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>Consequence/Action: <strong>{incident.action_taken || 'None'}</strong></span>
                    <span>Reported by: <strong>{incident.reported_by}</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentProfileDetailView;
