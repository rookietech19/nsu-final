// Academia Flow ERP - Dashboard View
import React, { useState, useEffect } from 'react';
import { base44 } from '../api/base44Client';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { 
  Users, 
  CalendarDays, 
  Award, 
  Clock, 
  UserPlus, 
  AlertTriangle, 
  Database,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

const DashboardView = ({ setActiveView, setSelectedStudentId }) => {
  const { user, isAdmin, hasWriteAccess } = useAuth();
  const { triggerToast } = useNotifications();
  const [stats, setStats] = useState({
    studentsCount: 0,
    attendanceRate: 100,
    upcomingExamsCount: 0,
    behaviorIncidentsCount: 0
  });
  const [recentAudits, setRecentAudits] = useState([]);
  const [recentBehaviors, setRecentBehaviors] = useState([]);

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      const students = await base44.entities.Student.list();
      const attendance = await base44.entities.Attendance.list();
      const schedules = await base44.entities.ExamSchedule.list();
      const behaviors = await base44.entities.BehaviourRecord.list();
      const audits = await base44.entities.AuditTrail.list();

      // Calc stats
      const totalStudents = students.length;
      
      let rate = 100;
      if (attendance.length > 0) {
        const presents = attendance.filter(a => a.status === 'Present' || a.status === 'Late' || a.status === 'Excused').length;
        rate = Math.round((presents / attendance.length) * 100);
      }

      const activeSchedules = schedules.filter(s => s.status === 'Scheduled').length;
      const totalIncidents = behaviors.length;

      setStats({
        studentsCount: totalStudents,
        attendanceRate: rate,
        upcomingExamsCount: activeSchedules,
        behaviorIncidentsCount: totalIncidents
      });

      // Recent activities: take top 5 audit logs
      setRecentAudits(audits.slice(0, 5));
      // Recent behaviors
      setRecentBehaviors(behaviors.slice(0, 3));
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
    }
  };

  useEffect(() => {
    loadDashboardData();
    // Refresh periodically
    const interval = setInterval(loadDashboardData, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleForceSeed = () => {
    try {
      base44.seedDemoData(true);
      loadDashboardData();
      triggerToast('Mock database seeded successfully with medical datasets!', 'success');
    } catch (err) {
      triggerToast('Seeding failed: ' + err.message, 'danger');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
      
      {/* Welcome Banner */}
      <div 
        className="glass-panel-elevated"
        style={{
          padding: '2rem',
          background: 'linear-gradient(135deg, hsla(var(--primary-h), var(--primary-s), var(--primary-l), 0.15) 0%, hsla(var(--primary-h), var(--primary-s), var(--primary-l), 0.05) 100%)',
          display: 'flex',
          justifyContent: 'between',
          alignItems: 'center',
          gap: '1.5rem',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem', fontFamily: 'var(--font-title)' }}>
            Welcome back, {user?.name}!
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '600px' }}>
            Academic operations are active. Review institutional stats, mark student attendances, evaluate semester grading, or check audit history.
          </p>
        </div>
        {isAdmin && (
          <button 
            className="btn btn-secondary"
            onClick={handleForceSeed}
            style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
          >
            <Database size={16} />
            Reset Demo Database
          </button>
        )}
      </div>

      {/* Grid statistics cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Card 1: Total Students */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div className="stat-icon" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}>
            <Users size={22} />
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Total Students</p>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, fontFamily: 'var(--font-title)' }}>{stats.studentsCount}</h3>
          </div>
        </div>

        {/* Card 2: Attendance Rate */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div className="stat-icon" style={{ background: 'var(--success-glow)', color: 'var(--success)' }}>
            <CalendarDays size={22} />
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Attendance Rate</p>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, fontFamily: 'var(--font-title)' }}>{stats.attendanceRate}%</h3>
          </div>
        </div>

        {/* Card 3: Upcoming Exams */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div className="stat-icon" style={{ background: 'var(--info-glow)', color: 'var(--info)' }}>
            <Award size={22} />
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Upcoming Exams</p>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, fontFamily: 'var(--font-title)' }}>{stats.upcomingExamsCount}</h3>
          </div>
        </div>

        {/* Card 4: Behavioral Portfolio */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div className="stat-icon" style={{ background: 'var(--warning-glow)', color: 'var(--warning)' }}>
            <Clock size={22} />
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Behavior Incident Log</p>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, fontFamily: 'var(--font-title)' }}>{stats.behaviorIncidentsCount}</h3>
          </div>
        </div>
      </div>

      {/* SVG Charts section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* SVG Chart 1: Grade Distributions */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            Grades Breakdown (Mid-Term Evaluated)
          </h3>
          
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '220px' }}>
            {/* SVG Visual Representation */}
            <svg viewBox="0 0 400 220" style={{ width: '100%', height: '100%' }}>
              {/* Grid Lines */}
              <line x1="40" y1="180" x2="380" y2="180" stroke="var(--border-color)" strokeWidth="1" />
              <line x1="40" y1="130" x2="380" y2="130" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="4 4" />
              <line x1="40" y1="80" x2="380" y2="80" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="4 4" />
              <line x1="40" y1="30" x2="380" y2="30" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="4 4" />

              {/* Bars */}
              {/* Grade A+: height 60% */}
              <rect x="70" y="70" width="30" height="110" rx="4" fill="var(--primary)" opacity="0.85" />
              <text x="85" y="60" textAnchor="middle" fill="var(--text-main)" fontSize="10" fontWeight="600">A+</text>
              <text x="85" y="195" textAnchor="middle" fill="var(--text-muted)" fontSize="10">A+</text>

              {/* Grade A: height 80% */}
              <rect x="130" y="40" width="30" height="140" rx="4" fill="var(--primary)" />
              <text x="145" y="30" textAnchor="middle" fill="var(--text-main)" fontSize="10" fontWeight="600">A</text>
              <text x="145" y="195" textAnchor="middle" fill="var(--text-muted)" fontSize="10">A</text>

              {/* Grade B: height 45% */}
              <rect x="190" y="95" width="30" height="85" rx="4" fill="var(--primary)" opacity="0.7" />
              <text x="205" y="85" textAnchor="middle" fill="var(--text-main)" fontSize="10" fontWeight="600">B</text>
              <text x="205" y="195" textAnchor="middle" fill="var(--text-muted)" fontSize="10">B</text>

              {/* Grade C: height 30% */}
              <rect x="250" y="120" width="30" height="60" rx="4" fill="var(--primary)" opacity="0.5" />
              <text x="265" y="110" textAnchor="middle" fill="var(--text-main)" fontSize="10" fontWeight="600">C</text>
              <text x="265" y="195" textAnchor="middle" fill="var(--text-muted)" fontSize="10">C</text>

              {/* Grade F: height 15% (Fail) */}
              <rect x="310" y="150" width="30" height="30" rx="4" fill="var(--danger)" opacity="0.85" />
              <text x="325" y="140" textAnchor="middle" fill="var(--danger)" fontSize="10" fontWeight="600">Fail</text>
              <text x="325" y="195" textAnchor="middle" fill="var(--text-muted)" fontSize="10">F</text>
            </svg>
          </div>
        </div>

        {/* SVG Chart 2: Attendance Trends */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Weekly Attendance Trend (%)
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
              <TrendingUp size={14} /> +2% this week
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '220px' }}>
            <svg viewBox="0 0 400 220" style={{ width: '100%', height: '100%' }}>
              {/* Grid Lines */}
              <line x1="40" y1="180" x2="380" y2="180" stroke="var(--border-color)" strokeWidth="1" />
              <line x1="40" y1="110" x2="380" y2="110" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="4 4" />
              <line x1="40" y1="40" x2="380" y2="40" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="4 4" />

              {/* Line graph points: (40, 180) to (380, 40) representing Mon-Fri */}
              {/* Monday: 85% -> y = 75 */}
              {/* Tuesday: 92% -> y = 56 */}
              {/* Wednesday: 88% -> y = 67 */}
              {/* Thursday: 96% -> y = 46 */}
              {/* Friday: 94% -> y = 51 */}
              <path 
                d="M 60 85 L 130 55 L 200 68 L 270 42 L 340 48" 
                fill="none" 
                stroke="var(--primary)" 
                strokeWidth="3.5" 
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Points circles */}
              <circle cx="60" cy="85" r="5" fill="var(--primary)" stroke="white" strokeWidth="1.5" />
              <circle cx="130" cy="55" r="5" fill="var(--primary)" stroke="white" strokeWidth="1.5" />
              <circle cx="200" cy="68" r="5" fill="var(--primary)" stroke="white" strokeWidth="1.5" />
              <circle cx="270" cy="42" r="5" fill="var(--primary)" stroke="white" strokeWidth="1.5" />
              <circle cx="340" cy="48" r="5" fill="var(--primary)" stroke="white" strokeWidth="1.5" />

              {/* Day Labels */}
              <text x="60" y="200" textAnchor="middle" fill="var(--text-muted)" fontSize="9">Mon</text>
              <text x="130" y="200" textAnchor="middle" fill="var(--text-muted)" fontSize="9">Tue</text>
              <text x="200" y="200" textAnchor="middle" fill="var(--text-muted)" fontSize="9">Wed</text>
              <text x="270" y="200" textAnchor="middle" fill="var(--text-muted)" fontSize="9">Thu</text>
              <text x="340" y="200" textAnchor="middle" fill="var(--text-muted)" fontSize="9">Fri</text>

              {/* Values */}
              <text x="60" y="73" textAnchor="middle" fill="var(--text-secondary)" fontSize="9" fontWeight="600">85%</text>
              <text x="130" y="43" textAnchor="middle" fill="var(--text-secondary)" fontSize="9" fontWeight="600">92%</text>
              <text x="200" y="56" textAnchor="middle" fill="var(--text-secondary)" fontSize="9" fontWeight="600">88%</text>
              <text x="270" y="30" textAnchor="middle" fill="var(--text-secondary)" fontSize="9" fontWeight="600">96%</text>
              <text x="340" y="36" textAnchor="middle" fill="var(--text-secondary)" fontSize="9" fontWeight="600">94%</text>
            </svg>
          </div>
        </div>
      </div>

      {/* Audit Trails and Quick actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 300px',
        gap: '1.5rem',
        alignItems: 'start'
      }}>
        
        {/* Left Side: Audit Trail logs */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            System Audit Trail Logs
            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>Latest Writes</span>
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentAudits.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem' }}>No database modifications recorded yet.</p>
            ) : (
              recentAudits.map(log => {
                const actionColor = log.action === 'CREATE' ? 'var(--success)' : log.action === 'UPDATE' ? 'var(--info)' : 'var(--danger)';
                const date = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                return (
                  <div 
                    key={log.id} 
                    style={{
                      display: 'flex',
                      alignItems: 'start',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      background: 'rgba(0,0,0,0.015)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <span 
                      className="badge" 
                      style={{ 
                        background: log.action === 'CREATE' ? 'var(--success-glow)' : log.action === 'UPDATE' ? 'var(--info-glow)' : 'var(--danger-glow)',
                        color: actionColor,
                        padding: '0.15rem 0.45rem',
                        fontSize: '0.7rem'
                      }}
                    >
                      {log.action}
                    </span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        Modified {log.entity} Record
                      </p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        By {log.userName} ({log.userRole}) &bull; ID: {log.recordId}
                      </p>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {date}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Quick Action Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Quick Actions Panel */}
          {hasWriteAccess && (
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>
                Quick Action Panel
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button 
                  onClick={() => setActiveView('attendance')}
                  className="btn btn-secondary" 
                  style={{ width: '100%', justifyContent: 'space-between' }}
                >
                  <span>Mark Attendances</span>
                  <ArrowRight size={14} />
                </button>
                <button 
                  onClick={() => setActiveView('exams')}
                  className="btn btn-secondary" 
                  style={{ width: '100%', justifyContent: 'space-between' }}
                >
                  <span>Grade Examinations</span>
                  <ArrowRight size={14} />
                </button>
                <button 
                  onClick={() => setActiveView('schedule')}
                  className="btn btn-secondary" 
                  style={{ width: '100%', justifyContent: 'space-between' }}
                >
                  <span>Exam Schedules</span>
                  <ArrowRight size={14} />
                </button>
                {isAdmin && (
                  <button 
                    onClick={() => setActiveView('college')}
                    className="btn btn-secondary" 
                    style={{ width: '100%', justifyContent: 'space-between' }}
                  >
                    <span>Configure Branding</span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Incident Warnings Panel */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--warning)' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />
              Recent Incidents
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {recentBehaviors.length === 0 ? (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No behavioral issues logged recently.</p>
              ) : (
                recentBehaviors.map(incident => (
                  <div 
                    key={incident.id}
                    onClick={() => {
                      setSelectedStudentId(incident.student_id);
                      setActiveView('students');
                    }}
                    style={{ 
                      fontSize: '0.75rem', 
                      padding: '0.5rem', 
                      borderRadius: '6px', 
                      background: incident.type === 'Negative' ? 'var(--danger-glow)' : 'var(--success-glow)',
                      color: incident.type === 'Negative' ? 'var(--danger)' : 'var(--success)',
                      cursor: 'pointer'
                    }}
                  >
                    <strong>{incident.student_name}</strong>: {incident.description.substring(0, 45)}...
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default DashboardView;
