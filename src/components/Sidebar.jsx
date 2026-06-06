// Academia Flow ERP - Sidebar Component (Collapsible + Mobile Responsive)
import React from 'react';
import { NavLink } from 'react-router-dom';
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
  DollarSign,
  UserCheck,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const { user } = useAuth();

  const menuItems = [
    { id: 'dashboard', path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['super_admin', 'admin', 'teacher', 'leader', 'student'] },
    { id: 'college', path: '/college', label: 'College Settings', icon: Settings, roles: ['super_admin', 'admin'] },
    { id: 'batches', path: '/batches', label: 'Batch Management', icon: Layers, roles: ['super_admin', 'admin'] },
    { id: 'students', path: '/students', label: 'Student Directory', icon: Users, roles: ['super_admin', 'admin', 'teacher', 'student'] },
    { id: 'attendance', path: '/attendance', label: 'Attendance Sheet', icon: ClipboardList, roles: ['super_admin', 'admin', 'teacher', 'leader', 'student'] },
    { id: 'exams', path: '/exams', label: 'Exam Evaluation', icon: FileSpreadsheet, roles: ['super_admin', 'admin', 'teacher', 'student'] },
    { id: 'behavior', path: '/behavior', label: 'Behavior Records', icon: HeartHandshake, roles: ['super_admin', 'admin', 'teacher'] },
    { id: 'schedule', path: '/schedule', label: 'Exam Schedule', icon: CalendarRange, roles: ['super_admin', 'admin', 'teacher', 'student'] },
    { id: 'fees', path: '/fees', label: 'Fee Management', icon: DollarSign, roles: ['super_admin', 'admin', 'student'] },
    { id: 'users', path: '/users', label: 'User Roles & Audits', icon: UserCheck, roles: ['super_admin'] }
  ];

  const visibleItems = menuItems.filter(item => {
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {/* Overlay backdrop for mobile */}
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          style={{ display: 'block' }}
        />
      )}

      <div
        className={`sidebar ${isOpen ? 'sidebar-open' : ''} ${isCollapsed ? 'sidebar-collapsed' : ''}`}
        style={{ width: isCollapsed ? '72px' : '260px' }}
      >
        {/* Brand Header */}
        <div style={{
          padding: isCollapsed ? '1.25rem 0' : '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '0.5rem',
          overflow: 'hidden',
          transition: 'padding 0.3s ease'
        }}>
          {/* Logo always visible */}
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--primary), hsl(var(--primary-h), var(--primary-s), calc(var(--primary-l) - 15%)))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1rem',
            fontFamily: 'var(--font-title)',
            boxShadow: 'var(--shadow-primary)',
            flexShrink: 0
          }}>
            AF
          </div>

          {/* Title text — hidden when collapsed */}
          {!isCollapsed && (
            <div style={{ flex: 1, marginLeft: '0.75rem', overflow: 'hidden' }}>
              <h1 style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.02em', margin: 0, whiteSpace: 'nowrap' }}>
                Academia Flow
              </h1>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>
                ERP Suite
              </p>
            </div>
          )}

          {/* Mobile close button */}
          {!isCollapsed && (
            <button
              onClick={onClose}
              className="hamburger-btn"
              style={{ display: 'flex', flexShrink: 0 }}
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Nav Links */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.2rem',
          padding: isCollapsed ? '0 0.5rem' : '0 0.75rem',
          flexGrow: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          transition: 'padding 0.3s ease'
        }}>
          {visibleItems.map(item => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={handleNavClick}
                title={isCollapsed ? item.label : ''}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  gap: isCollapsed ? 0 : '0.875rem',
                  width: '100%',
                  padding: isCollapsed ? '0.8rem' : '0.75rem 1rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: isActive
                    ? 'linear-gradient(135deg, var(--primary-glow), hsla(var(--primary-h), var(--primary-s), var(--primary-l), 0.08))'
                    : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  borderLeft: isActive && !isCollapsed ? '3px solid var(--primary)' : '3px solid transparent',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                })}
                className="sidebar-item"
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={isCollapsed ? 20 : 18}
                      style={{
                        color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                        flexShrink: 0,
                        transition: 'color 0.2s'
                      }}
                    />
                    {!isCollapsed && (
                      <span style={{ transition: 'opacity 0.2s', opacity: 1 }}>
                        {item.label}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Collapse Toggle Button (desktop only) */}
        <button
          onClick={onToggleCollapse}
          className="sidebar-collapse-btn"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            width: '100%',
            padding: '0.875rem',
            background: 'none',
            border: 'none',
            borderTop: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontFamily: 'var(--font-body)',
            transition: 'all 0.2s',
          }}
          onMouseOver={e => { e.currentTarget.style.background = 'var(--primary-glow)'; e.currentTarget.style.color = 'var(--primary)'; }}
          onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          {isCollapsed ? <ChevronRight size={18} /> : (
            <>
              <ChevronLeft size={18} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </>
  );
};

export default Sidebar;
