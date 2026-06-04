// Academia Flow ERP - Main Application Entry
import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';

// Views
import Sidebar from './components/Sidebar';
import FeeDashboard from './views/FeeDashboard';
import Header from './components/Header';
import DashboardView from './views/DashboardView';
import CollegeSettingsView from './views/CollegeSettingsView';
import BatchManagementView from './views/BatchManagementView';
import StudentManagementView from './views/StudentManagementView';
import StudentProfileDetailView from './views/StudentProfileDetailView';
import AttendanceView from './views/AttendanceView';
import ExaminationView from './views/ExaminationView';
import BehaviorView from './views/BehaviorView';
import ExamScheduleView from './views/ExamScheduleView';
import ClassTypesView from './views/ClassTypesView';
import UserManagementView from './views/UserManagementView';

// Icons
import { AlertCircle, Lock, Undo2, X, GraduationCap } from 'lucide-react';

const MainAppContent = () => {
  const { isAuthenticated, isLoading, login, user } = useAuth();
  const { toasts, removeToast, executeUndo, lastAction } = useNotifications();
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [loginRole, setLoginRole] = useState('admin');

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: '1rem',
        background: 'var(--bg-gradient)',
        color: 'var(--text-main)'
      }}>
        <GraduationCap size={48} className="animate-pulse" style={{ color: 'var(--primary)' }} />
        <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 700 }}>Academia Flow Portal</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Validating credentials...</p>
      </div>
    );
  }

  // Login Screen if not Authenticated
  if (!isAuthenticated) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '1.5rem',
        background: 'var(--bg-gradient)'
      }}>
        <div 
          className="glass-panel-elevated animate-fade-in"
          style={{
            width: '100%',
            maxWidth: '440px',
            padding: '2.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}
        >
          {/* Logo Branding */}
          <div style={{ flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.75rem',
              fontWeight: 800,
              fontFamily: 'var(--font-title)',
              boxShadow: 'var(--shadow-primary)'
            }}>
              AF
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, fontFamily: 'var(--font-title)' }}>
              Academia Flow
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Academic Management ERP Suite
            </p>
          </div>

          <div style={{ width: '100%', height: '1px', background: 'var(--border-color)' }} />

          {/* Role selector to test different options */}
          <div className="form-group" style={{ textAlign: 'left', marginBottom: 0 }}>
            <label className="form-label">Choose Simulation Access Level</label>
            <select 
              className="form-input"
              value={loginRole}
              onChange={(e) => setLoginRole(e.target.value)}
              style={{ padding: '0.75rem' }}
            >
              <option value="admin">Administrator (Full Write/Settings Control)</option>
              <option value="teacher">Teacher (Student, Grades, Attendance Writes)</option>
              <option value="user">Student / User (Read-Only Directory View)</option>
            </select>
          </div>

          {/* Sign In Button */}
          <button 
            onClick={() => login(loginRole)}
            className="btn btn-primary"
            style={{
              padding: '0.875rem',
              fontSize: '0.95rem',
              fontWeight: 600,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              width: '100%'
            }}
          >
            <Lock size={16} />
            Sign In with Google Account
          </button>

          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
            Secure institutional authentication provided by Google OAuth.
          </p>
        </div>
      </div>
    );
  }

  // Active View Router
  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView setActiveView={setActiveView} setSelectedStudentId={setSelectedStudentId} />;
      case 'college':
        return <CollegeSettingsView />;
      case 'batches':
        return <BatchManagementView />;
      case 'students':
        return <StudentManagementView setActiveView={setActiveView} setSelectedStudentId={setSelectedStudentId} />;
      case 'student-profile':
        return <StudentProfileDetailView studentId={selectedStudentId} setActiveView={setActiveView} />;
      case 'attendance':
        return <AttendanceView />;
      case 'exams':
        return <ExaminationView />;
      case 'behavior':
        return <BehaviorView />;
      case 'schedule':
        return <ExamScheduleView />;
      case 'fees':
        return <FeeDashboard />;
      case 'class-types':
        return <ClassTypesView />;
      case 'users':
        return <UserManagementView />;
      default:
        return <DashboardView setActiveView={setActiveView} setSelectedStudentId={setSelectedStudentId} />;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar activeView={activeView} setActiveView={setActiveView} />

      {/* Header Bar */}
      <Header activeView={activeView} />

      {/* Main Viewport Content */}
      <div className="main-content">
        {renderView()}
      </div>

      {/* Floating Action/Toast Center Notifications */}
      <div 
        className="no-print"
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          width: '320px'
        }}
      >
        {/* Undo Toast */}
        {lastAction && (
          <div 
            className="glass-panel-elevated animate-fade-in"
            style={{
              padding: '0.875rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              borderLeft: '4px solid var(--primary)',
              background: 'var(--card-bg)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Undo2 size={16} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Action Undo Available</span>
            </div>
            <button 
              className="btn btn-primary" 
              style={{ padding: '0.25rem 0.625rem', fontSize: '0.7rem', borderRadius: '4px' }}
              onClick={executeUndo}
            >
              Undo
            </button>
          </div>
        )}

        {/* Dynamic Toasts Stack */}
        {toasts.map(toast => {
          let typeColor = 'var(--primary)';
          let bgGlow = 'var(--primary-glow)';
          
          if (toast.type === 'success') {
            typeColor = 'var(--success)';
            bgGlow = 'var(--success-glow)';
          } else if (toast.type === 'warning') {
            typeColor = 'var(--warning)';
            bgGlow = 'var(--warning-glow)';
          } else if (toast.type === 'danger') {
            typeColor = 'var(--danger)';
            bgGlow = 'var(--danger-glow)';
          }

          return (
            <div
              key={toast.id}
              className="glass-panel-elevated animate-fade-in"
              style={{
                padding: '0.875rem 1.25rem',
                borderLeft: `4px solid ${typeColor}`,
                display: 'flex',
                alignItems: 'start',
                gap: '0.75rem',
                background: 'var(--card-bg)'
              }}
            >
              <AlertCircle size={16} style={{ color: typeColor, marginTop: '0.125rem', flexShrink: 0 }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 500, flex: 1, color: 'var(--text-main)' }}>
                {toast.message}
              </span>
              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MainAppContent />
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
