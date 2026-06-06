// Academia Flow ERP - Class Classification Types View
import React, { useState, useEffect } from 'react';
import { base44 } from '../api/base44Client';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Tag, Plus, Edit2, Trash2, ShieldAlert } from 'lucide-react';

const ClassTypesView = () => {
  const { isAdmin } = useAuth();
  const { triggerToast, trackAction } = useNotifications();
  const [classTypes, setClassTypes] = useState([]);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6'
  });

  const loadData = async () => {
    try {
      const list = await base44.entities.ClassType.list();
      setClassTypes(list);
    } catch (err) {
      console.error(err);
      triggerToast('Failed to load class classifications.', 'danger');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    if (!isAdmin) {
      triggerToast('Permission Denied: Only Admins can define new class types.', 'danger');
      return;
    }
    setEditingType(null);
    setFormData({ name: '', description: '', color: '#3b82f6' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ct) => {
    if (!isAdmin) {
      triggerToast('Permission Denied: Only Admins can edit class types.', 'danger');
      return;
    }
    setEditingType(ct);
    setFormData({
      name: ct.name || '',
      description: ct.description || '',
      color: ct.color || '#3b82f6'
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!isAdmin) {
      triggerToast('Permission Denied: Only Admins can delete class types.', 'danger');
      return;
    }

    if (window.confirm('Are you sure you want to remove this class type classification?')) {
      try {
        const deleted = await base44.entities.ClassType.delete(id);
        trackAction('ClassType', 'DELETE', deleted); // Track undo
        triggerToast('Class type deleted.', 'success');
        loadData();
      } catch (err) {
        console.error(err);
        triggerToast(err.message, 'danger'); // Relational check (active attendance reference)
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingType) {
        await base44.entities.ClassType.update(editingType.id, {
          ...formData,
          version: editingType.version
        });
        triggerToast('Class type details updated.', 'success');
      } else {
        await base44.entities.ClassType.create(formData);
        triggerToast('New class type registered.', 'success');
      }

      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      triggerToast(err.message, 'danger');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
      
      {/* Header action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Class Classifications</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Define standard class categories used for session marking across the institution</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} />
            Add Class Type
          </button>
        )}
      </div>

      {/* Grid listing */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))',
        gap: '1.5rem'
      }}>
        {classTypes.map(ct => (
          <div key={ct.id} className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span 
                  style={{ 
                    width: '12px', 
                    height: '12px', 
                    borderRadius: '50%', 
                    background: ct.color, 
                    display: 'inline-block',
                    boxShadow: `0 0 8px ${ct.color}`
                  }} 
                />
                <h4 style={{ margin: 0, fontSize: '0.925rem', fontWeight: 700 }}>{ct.name}</h4>
              </div>

              {isAdmin && (
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button 
                    onClick={() => handleOpenEdit(ct)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
                    onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'}
                    onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    title="Edit Class Type"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => handleDelete(ct.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
                    onMouseOver={(e) => e.currentTarget.style.color = 'var(--danger)'}
                    onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    title="Delete Class Type"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>

            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', flexGrow: 1 }}>
              {ct.description || 'No description recorded.'}
            </p>
          </div>
        ))}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '60px 1.5rem 1.5rem 1.5rem'
        }}>
          <div className="glass-panel-elevated animate-fade-in" style={{ 
            width: '100%', 
            maxWidth: '440px', 
            maxHeight: '85vh',
            padding: '2rem', 
            background: 'var(--card-bg)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>
              {editingType ? 'Modify Class Classification' : 'Add Class Classification'}
            </h3>

            <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Classification Name (e.g. Ward Round, Practical)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.name} 
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required 
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">UI Accent Color (Hex/Picker)</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input 
                    type="color" 
                    className="form-input" 
                    style={{ width: '60px', padding: '0.15rem', height: '40px', cursor: 'pointer' }}
                    value={formData.color} 
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    required 
                  />
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.color} 
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    required 
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Description (Optional)</label>
                <textarea 
                  className="form-input" 
                  style={{ height: '70px', resize: 'none' }}
                  value={formData.description} 
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Classification</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ClassTypesView;
