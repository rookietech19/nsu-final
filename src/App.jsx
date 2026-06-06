// Academia Flow ERP - Main Application Entry
import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';

// Guards
import { ProtectedRoute, RoleRoute } from './router/guards';

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

const LoginScreen = () => {
  const { login, register, isAuthenticated, isLoading } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      if (isRegisterMode) {
        await register(name.trim(), email.trim(), password);
        setMessage('Request submitted. Please wait for admin approval before you can sign in.');
        setName('');
        setEmail('');
        setPassword('');
      } else {
        await login(email.trim(), password);
      }
    } catch (err) {
      setError(err?.message || 'Unable to complete request.');
    }
  };

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
          maxWidth: '460px',
          padding: '2.5rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
            boxShadow: 'var(--shadow-primary)',
            margin: '0 auto 1rem auto'
          }}>
            AF
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, fontFamily: 'var(--font-title)' }}>
            Academia Flow
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
            Sign in with your Gmail address and password.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {isRegisterMode && (
            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }} htmlFor="login-name">
                Full name
              </label>
              <input
                id="login-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  background: 'rgba(255,255,255,0.85)',
                  color: 'var(--text-main)'
                }}
              />
            </div>
          )}

          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }} htmlFor="login-email">
              Gmail address
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                background: 'rgba(255,255,255,0.85)',
                color: 'var(--text-main)'
              }}
            />
          </div>

          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }} htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                background: 'rgba(255,255,255,0.85)',
                color: 'var(--text-main)'
              }}
            />
          </div>

          {error && (
            <div style={{ color: 'var(--danger)', fontSize: '0.85rem', textAlign: 'left' }}>
              {error}
            </div>
          )}

          {message && (
            <div style={{ color: 'var(--success)', fontSize: '0.85rem', textAlign: 'left' }}>
              {message}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
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
            {isLoading ? (isRegisterMode ? 'Submitting...' : 'Signing in...') : (isRegisterMode ? 'Request Access' : 'Sign In')}
          </button>
        </form>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            setIsRegisterMode(prev => !prev);
            setError('');
            setMessage('');
          }}
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
          {isRegisterMode ? 'Back to Login' : 'Request New Access'}
        </button>

        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
          New Gmail users are created as pending access. Super admin or admin must approve before login is allowed.
        </p>
      </div>
    </div>
  );
};

const MainAppLayout = () => {
  const { toasts, removeToast, executeUndo, lastAction } = useNotifications();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('acadflow_sidebar_collapsed') === 'true';
  });

  const handleMenuToggle = () => setSidebarOpen(prev => !prev);
  const handleSidebarClose = () => setSidebarOpen(false);
  const handleToggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('acadflow_sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} isCollapsed={isCollapsed} onToggleCollapse={handleToggleCollapse} />
      <Header onMenuToggle={handleMenuToggle} isCollapsed={isCollapsed} />

      <div className="main-content" style={{ marginLeft: isCollapsed ? '72px' : '260px' }}>
        <Routes>
          <Route path="/" element={<DashboardView />} />
          <Route path="/college" element={
            <RoleRoute allowedRoles={['super_admin', 'admin']}>
              <CollegeSettingsView />
            </RoleRoute>
          } />
          <Route path="/batches" element={
            <RoleRoute allowedRoles={['super_admin', 'admin']}>
              <BatchManagementView />
            </RoleRoute>
          } />
          <Route path="/students" element={
            <RoleRoute allowedRoles={['super_admin', 'admin', 'teacher', 'student']}>
              <StudentManagementView />
            </RoleRoute>
          } />
          <Route path="/student-profile/:id" element={
            <RoleRoute allowedRoles={['super_admin', 'admin', 'teacher', 'student']}>
              <StudentProfileDetailView />
            </RoleRoute>
          } />
          <Route path="/attendance" element={
            <RoleRoute allowedRoles={['super_admin', 'admin', 'teacher', 'leader', 'student']}>
              <AttendanceView />
            </RoleRoute>
          } />
          <Route path="/exams" element={
            <RoleRoute allowedRoles={['super_admin', 'admin', 'teacher', 'student']}>
              <ExaminationView />
            </RoleRoute>
          } />
          <Route path="/behavior" element={
            <RoleRoute allowedRoles={['super_admin', 'admin', 'teacher']}>
              <BehaviorView />
            </RoleRoute>
          } />
          <Route path="/schedule" element={
            <RoleRoute allowedRoles={['super_admin', 'admin', 'teacher', 'student']}>
              <ExamScheduleView />
            </RoleRoute>
          } />
          <Route path="/fees" element={
            <RoleRoute allowedRoles={['super_admin', 'admin', 'student']}>
              <FeeDashboard />
            </RoleRoute>
          } />
          <Route path="/class-types" element={
            <RoleRoute allowedRoles={['super_admin', 'admin']}>
              <ClassTypesView />
            </RoleRoute>
          } />
          <Route path="/users" element={
            <RoleRoute allowedRoles={['super_admin']}>
              <UserManagementView />
            </RoleRoute>
          } />
          <Route path="/unauthorized" element={
            <div className="flex h-screen items-center justify-center flex-col">
              <h2>Unauthorized Access</h2>
              <p>You do not have permission to view this page.</p>
            </div>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
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
          width: '320px',
          maxWidth: 'calc(100vw - 3rem)'
        }}
      >
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

const RootRouter = () => {
  const { isLoading } = useAuth();
  
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

  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <MainAppLayout />
        </ProtectedRoute>
      } />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <RootRouter />
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
