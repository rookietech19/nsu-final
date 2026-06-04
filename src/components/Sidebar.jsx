// Academia Flow ERP - Sidebar Component
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Settings, 
  Layers, 
  Users, 
  ClipboardList, 
  FileSpreadsheet, 
  HeartHandshake, 
  CalendarRange, 
  Tag, 
  DollarSign,
  UserCheck 
} from 'lucide-react';

const Sidebar = ({ activeView, setActiveView }) => {
  const { user, isAdmin, hasWriteAccess } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'teacher', 'user'] },
    { id: 'college', label: 'College Settings', icon: Settings, roles: ['admin'] },
    { id: 'batches', label: 'Batch Management', icon: Layers, roles: ['admin', 'teacher'] },
    { id: 'students', label: 'Student Directory', icon: Users, roles: ['admin', 'teacher', 'user'] },
    { id: 'attendance', label: 'Attendance Sheet', icon: ClipboardList, roles: ['admin', 'teacher', 'user'] },
    { id: 'exams', label: 'Exam Evaluation', icon: FileSpreadsheet, roles: ['admin', 'teacher', 'user'] },
    { id: 'behavior', label: 'Behavior Records', icon: HeartHandshake, roles: ['admin', 'teacher', 'user'] },
    { id: 'schedule', label: 'Exam Schedule', icon: CalendarRange, roles: ['admin', 'teacher', 'user'] },
    { id: 'fees', label: 'Fee Management', icon: DollarSign, roles: ['admin', 'teacher', 'user'] },
    { id: 'users', label: 'User Roles & Audits', icon: UserCheck, roles: ['admin'] }
  ];

  const handleNavClick = (viewId) => {
    setActiveView(viewId);
  };

  // Filter menu items by user role
  const visibleItems = menuItems.filter(item => {
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  return (
    <div className="sidebar">
      {/* Brand Header */}
      <div style={{
        padding: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '1rem'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          background: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '1.2rem',
          fontFamily: 'var(--font-title)'
        }}>
          AF
        </div>
        <div>
          <h1 style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
            Academia Flow
          </h1>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>
            Medical ERP Suite
          </p>
        </div>
      </div>

      {/* Nav Links */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0 0.75rem', flexGrow: 1, overflowY: 'auto' }}>
        {visibleItems.map(item => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.875rem',
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                border: 'none',
                background: isActive ? 'var(--primary-glow)' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
              className="sidebar-item"
            >
              <Icon size={18} style={{ color: isActive ? 'var(--primary)' : 'var(--text-muted)' }} />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Sticky footer info */}
      <div style={{
        padding: '1rem',
        borderTop: '1px solid var(--border-color)',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        textAlign: 'center'
      }}>
        v1.0.0 &bull; Local Database
      </div>
    </div>
  );
};

export default Sidebar;
