// Academia Flow ERP - Header Component
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Bell, Moon, Sun, LogOut, CheckCircle, Menu } from 'lucide-react';
import { base44 } from '../api/base44Client';

const Header = ({ onMenuToggle, isCollapsed }) => {
  const { user, logout } = useAuth();
  const { notifications, checkSystemAlerts } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [darkTheme, setDarkTheme] = useState(() => {
    return localStorage.getItem('acadflow_theme') === 'dark';
  });
  const [collegeName, setCollegeName] = useState('Academia Flow');
  const location = useLocation();

  // Determine active view from URL path
  const activeView = location.pathname.split('/')[1] || 'dashboard';

  // Load college details for branding
  useEffect(() => {
    const loadCollege = async () => {
      try {
        const colList = await base44.entities.College.list();
        if (colList.length > 0) {
          setCollegeName(colList[0].name);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadCollege();
    // Re-load on event or periodically
    const interval = setInterval(loadCollege, 5000);
    return () => clearInterval(interval);
  }, []);

  // Sync theme to document body
  useEffect(() => {
    if (darkTheme) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('acadflow_theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('acadflow_theme', 'light');
    }
  }, [darkTheme]);

  const viewTitles = {
    dashboard: 'Administrative Dashboard',
    college: 'College Branding & Settings',
    batches: 'Academic Cohorts & Batches',
    students: 'Student Records Directory',
    attendance: 'Attendance Management Sheet',
    exams: 'Examination Performance & Grades',
    behavior: 'Student Conduct & Behavior Portfolio',
    schedule: 'Examination Timetable Schedules',
    'class-types': 'Class Classification Types',
    users: 'System Users Roles & Security Audits'
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'super_admin':
      case 'admin': return 'badge-danger';
      case 'teacher': return 'badge-success';
      case 'leader': return 'badge-warning';
      default: return 'badge-info';
    }
  };

  return (
    <div className="header-bar no-print" style={{ left: 'var(--sidebar-current-width, 260px)', transition: 'left 0.3s ease' }}
      ref={el => {
        if (el) {
          el.style.setProperty('--sidebar-current-width', isCollapsed ? '72px' : '260px');
        }
      }}
    >
      {/* Hamburger + View Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          className="hamburger-btn"
          onClick={onMenuToggle}
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>
        <div>
          <h2 className="header-title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)', fontFamily: 'var(--font-title)' }}>
            {viewTitles[activeView] || 'Academia Flow'}
          </h2>
          <p className="header-subtitle" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
            {collegeName}
          </p>
        </div>
      </div>

      {/* Header Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        
        {/* Dark Mode Switcher */}
        <button
          onClick={() => setDarkTheme(prev => !prev)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s'
          }}
          title={darkTheme ? "Switch to Light Mode" : "Switch to Dark Mode"}
          onMouseOver={(e) => e.currentTarget.style.background = 'var(--primary-glow)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'none'}
        >
          {darkTheme ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notifications Popover Bell */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications(prev => !prev)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--primary-glow)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'none'}
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <span className="badge-count">{notifications.length}</span>
            )}
          </button>

          {showNotifications && (
            <div 
              className="glass-panel" 
              style={{
                position: 'absolute',
                top: '2.5rem',
                right: 0,
                width: '320px',
                maxWidth: 'calc(100vw - 2rem)',
                zIndex: 100,
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                animation: 'fadeIn 0.2s ease-out'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>System Alerts</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{notifications.length} active</span>
              </div>

              {notifications.length === 0 ? (
                <div style={{ padding: '1rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                  <CheckCircle size={24} style={{ color: 'var(--success)' }} />
                  <span>All tasks up to date!</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                  {notifications.map(alert => (
                    <div 
                      key={alert.id}
                      style={{
                        padding: '0.625rem',
                        borderRadius: '8px',
                        background: alert.type === 'warning' ? 'var(--warning-glow)' : 'var(--info-glow)',
                        borderLeft: `3px solid ${alert.type === 'warning' ? 'var(--warning)' : 'var(--info)'}`,
                        fontSize: '0.75rem'
                      }}
                    >
                      <p style={{ margin: 0, fontWeight: 500, color: 'var(--text-main)' }}>{alert.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Vertical divider */}
        <div style={{ width: '1px', height: '1.5rem', background: 'var(--border-color)' }} />

        {/* User Card Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img
            src={user?.photo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'User'}`}
            alt={user?.name}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid var(--primary-glow)'
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <span className="header-user-name" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.2 }}>
              {user?.name || 'Academic Staff'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.125rem' }}>
              <span className={`badge ${getRoleBadgeColor(user?.role)}`} style={{ padding: '0.05rem 0.35rem', fontSize: '0.65rem' }}>
                {(user?.role || 'user').toUpperCase()}
              </span>
            </div>
          </div>
          
          {/* Logout Button */}
          <button
            onClick={logout}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.25rem',
              marginLeft: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'var(--danger-glow)';
              e.currentTarget.style.color = 'var(--danger)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>

      </div>
    </div>
  );
};

export default Header;
