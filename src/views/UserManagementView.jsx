// Academia Flow ERP - User Roles, Audits & Backups View
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { base44 } from '../api/base44Client';
import { ShieldCheck, History, Download, Upload, ShieldAlert, ArrowRight, UserCog } from 'lucide-react';

const UserManagementView = () => {
  const { allUsers, promoteUser, user: currentUser } = useAuth();
  const { triggerToast } = useNotifications();

  // Active Tab
  const [activeTab, setActiveTab] = useState('users');

  // Logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState('All');

  // Backup file state
  const [backupFile, setBackupFile] = useState(null);

  const loadAudits = async () => {
    try {
      const audits = await base44.entities.AuditTrail.list();
      setAuditLogs(audits);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'audits') {
      loadAudits();
    }
  }, [activeTab]);

  const handleRoleChange = async (userId, email, newRole) => {
    if (email === currentUser?.email) {
      triggerToast('Security Lock: You cannot modify your own administrative role.', 'warning');
      return;
    }

    try {
      await promoteUser(userId, newRole);
      triggerToast(`Privilege level updated for ${email} to ${newRole}.`, 'success');
    } catch (err) {
      triggerToast('Failed to modify user role: ' + err.message, 'danger');
    }
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    try {
      const dbKeys = ['College', 'Batch', 'Student', 'Attendance', 'Examination', 'BehaviourRecord', 'ClassType', 'ExamSchedule', 'User', 'AuditTrail'];
      const backupData = {};

      dbKeys.forEach(key => {
        const raw = localStorage.getItem(`acadflow_${key}`);
        backupData[key] = raw ? JSON.parse(raw) : [];
      });

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `AcademiaFlow_Backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      triggerToast('Database configuration backup downloaded successfully.', 'success');
    } catch (err) {
      console.error(err);
      triggerToast('Backup generation failed.', 'danger');
    }
  };

  // Import JSON Backup
  const handleImportBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBackupFile(file);
  };

  const handleConfirmRestore = () => {
    if (!backupFile) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        const requiredKeys = ['College', 'Batch', 'Student', 'Attendance', 'Examination', 'BehaviourRecord', 'ClassType', 'ExamSchedule', 'User', 'AuditTrail'];
        
        // Verify key integrity
        const keysMatch = requiredKeys.every(k => data[k] !== undefined);
        if (!keysMatch) {
          throw new Error('Schema Mismatch: Uploaded file is not a valid Academia Flow database backup.');
        }

        // Apply backup
        requiredKeys.forEach(k => {
          localStorage.setItem(`acadflow_${k}`, JSON.stringify(data[k]));
        });

        triggerToast('System database restored successfully! Reloading...', 'success');
        
        // Reload after 1.5 seconds to refresh context
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err) {
        console.error(err);
        triggerToast('Restore failed: ' + err.message, 'danger');
      }
    };
    reader.readAsText(backupFile);
  };

  // Filter audit logs
  const filteredAudits = auditLogs.filter(log => {
    return selectedEntity === 'All' || log.entity === selectedEntity;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
      
      {/* Sub-tabs menu */}
      <div className="tabs-container">
        <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          <ShieldCheck size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          User Access Control
        </button>
        <button className={`tab-btn ${activeTab === 'audits' ? 'active' : ''}`} onClick={() => setActiveTab('audits')}>
          <History size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Security Audit Trails
        </button>
        <button className={`tab-btn ${activeTab === 'utilities' ? 'active' : ''}`} onClick={() => setActiveTab('utilities')}>
          <Download size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Database Backup & Utilities
        </button>
      </div>

      {/* TAB CONTENT: USER ACCESS */}
      {activeTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Registered Portal Users</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Promote staff roles to control editing capabilities across all entities</p>
          </div>

          <div className="table-container">
            <table className="table-main">
              <thead>
                <tr>
                  <th className="table-th">User Name</th>
                  <th className="table-th">OAuth Gmail Address</th>
                  <th className="table-th">User Authorization Role</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map(user => (
                  <tr key={user.id} className="table-row">
                    <td className="table-td" style={{ fontWeight: 600, color: 'var(--text-main)' }}>{user.name}</td>
                    <td className="table-td">{user.email}</td>
                    <td className="table-td">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <UserCog size={14} style={{ color: 'var(--text-muted)' }} />
                        <select 
                          className="form-input" 
                          style={{ width: '130px', padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, user.email, e.target.value)}
                          disabled={user.email === currentUser?.email}
                        >
                          <option value="admin">Admin</option>
                          <option value="teacher">Teacher</option>
                          <option value="user">User (Read-only)</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: SECURITY AUDITS */}
      {activeTab === 'audits' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Header & Filter */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Security Trail Logs</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Chronological log audits of all database creations, edits, and deletions</p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Filter Entity:</span>
              <select 
                className="form-input" 
                style={{ width: '180px', padding: '0.5rem' }}
                value={selectedEntity}
                onChange={(e) => setSelectedEntity(e.target.value)}
              >
                <option value="All">All Tables</option>
                <option value="College">College Settings</option>
                <option value="Batch">Batches</option>
                <option value="Student">Students</option>
                <option value="Attendance">Attendance</option>
                <option value="Examination">Examinations</option>
                <option value="BehaviourRecord">Behaviors</option>
                <option value="ClassType">Class Types</option>
                <option value="ExamSchedule">Exam Schedules</option>
              </select>
            </div>
          </div>

          {/* Audits Table */}
          <div className="table-container" style={{ maxHeight: '420px', overflowY: 'auto' }}>
            <table className="table-main">
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.015)' }}>
                  <th className="table-th">Timestamp</th>
                  <th className="table-th">Entity</th>
                  <th className="table-th">Action</th>
                  <th className="table-th">Record ID</th>
                  <th className="table-th">Authorized User</th>
                </tr>
              </thead>
              <tbody>
                {filteredAudits.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="table-td" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No audit trails registered.
                    </td>
                  </tr>
                ) : (
                  filteredAudits.map(log => {
                    const actionColor = log.action === 'CREATE' ? 'badge-success' : log.action === 'UPDATE' ? 'badge-info' : 'badge-danger';
                    
                    return (
                      <tr key={log.id} className="table-row" style={{ fontSize: '0.85rem' }}>
                        <td className="table-td" style={{ color: 'var(--text-muted)' }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="table-td" style={{ fontWeight: 600 }}>{log.entity}</td>
                        <td className="table-td">
                          <span className={`badge ${actionColor}`} style={{ fontSize: '0.65rem' }}>
                            {log.action}
                          </span>
                        </td>
                        <td className="table-td" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{log.recordId}</td>
                        <td className="table-td">
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{log.userName}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{log.userId} ({log.userRole})</div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: UTILITIES */}
      {activeTab === 'utilities' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          
          {/* Backup block */}
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Backup Settings Configurations
            </h4>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0 }}>
              Export and download the entire institutional database state as a JSON file. This can be stored offline or imported to restore the exact state.
            </p>
            <button className="btn btn-primary" onClick={handleExportBackup} style={{ marginTop: '0.5rem', width: 'fit-content' }}>
              <Download size={16} />
              Export Database State
            </button>
          </div>

          {/* Restore block */}
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--warning)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Restore Database State
            </h4>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0 }}>
              Upload a valid database JSON backup file to restore records. <strong style={{ color: 'var(--danger)' }}>WARNING: This will completely overwrite all local storage configurations!</strong>
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input type="file" accept=".json" onChange={handleImportBackup} className="form-input" />
              {backupFile && (
                <button className="btn btn-danger" onClick={handleConfirmRestore} style={{ width: 'fit-content' }}>
                  <Upload size={16} />
                  Restore Configuration
                </button>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default UserManagementView;
