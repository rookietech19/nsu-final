// Academia Flow ERP - College Settings View
import React, { useState, useEffect } from 'react';
import { base44 } from '../api/base44Client';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { ShieldCheck, Edit, Save, Plus } from 'lucide-react';

const CollegeSettingsView = () => {
  const { isAdmin } = useAuth();
  const { triggerToast, trackAction } = useNotifications();
  const [colleges, setColleges] = useState([]);
  const [college, setCollege] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    faculty: '',
    phone: '',
    email: '',
    address: '',
    logo_url: '',
    dean_name: '',
    dean_title: '',
    passing_marks: 60,
    total_marks: 100
  });

  const loadCollegeData = async () => {
    try {
      const list = await base44.entities.College.list();
      setColleges(list);
      if (list.length > 0) {
        const first = list[0];
        setCollege(first);
        setFormData({
          name: first.name || '',
          faculty: first.faculty || '',
          phone: first.phone || '',
          email: first.email || '',
          address: first.address || '',
          logo_url: first.logo_url || '',
          dean_name: first.dean_name || '',
          dean_title: first.dean_title || '',
          passing_marks: first.passing_marks ?? 60,
          total_marks: first.total_marks ?? 100
        });
      } else {
        setCollege(null);
        setFormData({
          name: '',
          faculty: '',
          phone: '',
          email: '',
          address: '',
          logo_url: '',
          dean_name: '',
          dean_title: '',
          passing_marks: 60,
          total_marks: 100
        });
      }
    } catch (err) {
      console.error(err);
      triggerToast('Failed to load college settings.', 'danger');
    }
  };

  // Helper to switch selected college
  const selectCollege = (col) => {
    setCollege(col);
    setFormData({
      name: col.name || '',
      faculty: col.faculty || '',
      phone: col.phone || '',
      email: col.email || '',
      address: col.address || '',
      logo_url: col.logo_url || '',
      dean_name: col.dean_name || '',
      dean_title: col.dean_title || '',
      passing_marks: col.passing_marks ?? 60,
      total_marks: col.total_marks ?? 100
    });
    setIsEditing(false);
  };

  const handleAddCollege = () => {
    setCollege(null);
    setFormData({
      name: '',
      faculty: '',
      phone: '',
      email: '',
      address: '',
      logo_url: '',
      dean_name: '',
      dean_title: '',
      passing_marks: 60,
      total_marks: 100
    });
    setIsEditing(true);
  };

  useEffect(() => {
    loadCollegeData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === 'passing_marks' || name === 'total_marks') ? Number(value) : value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      triggerToast('Permission Denied: Only Admins can modify college settings.', 'danger');
      return;
    }

    try {
      let updated;
        if (college) {
          // Update existing college
          updated = await base44.entities.College.update(college.id, {
            ...formData,
            version: college.version
          });
          trackAction('College', 'UPDATE', college);
        } else {
          // Create a new college entry
          updated = await base44.entities.College.create(formData);
          // Refresh the list after creation
          const refreshed = await base44.entities.College.list();
          setColleges(refreshed);
        }
        setCollege(updated);
        setIsEditing(false);
        triggerToast('College information saved successfully.', 'success');
    } catch (err) {
      console.error(err);
      triggerToast(err.message, 'danger');
    }
  };

  if (!formData.name && !college && colleges.length === 0) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading configurations...</div>;
  }

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
      {/* College Selector */}
      {colleges.length > 0 && (
        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <select
            value={college ? college.id : ''}
            onChange={e => {
              const selected = colleges.find(c => c.id === e.target.value);
              if (selected) selectCollege(selected);
            }}
            className="form-select"
          >
            <option value="" disabled>Select College</option>
            {colleges.map(c => (
              <option key={c.id} value={c.id}>{c.name || 'Unnamed College'}</option>
            ))}
          </select>
          <button onClick={handleAddCollege} className="btn btn-primary">
            <Plus size={14} /> Add College
          </button>
        </div>
      )}

      {/* Branding and Edit Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '1rem',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {formData.logo_url && (
            <img 
              src={formData.logo_url} 
              alt="Logo Preview" 
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '8px',
                objectFit: 'cover',
                border: '1px solid var(--border-color)'
              }} 
            />
          )}
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              {formData.name || 'Branding Profile'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              {formData.faculty || 'Institution settings'}
            </p>
          </div>
        </div>

        {isAdmin && (
          <button 
            onClick={() => setIsEditing(prev => !prev)}
            className="btn btn-secondary"
          >
            {isEditing ? 'Cancel Edit' : (
              <>
                <Edit size={14} />
                Edit Settings
              </>
            )}
          </button>
        )}
      </div>

      <form onSubmit={handleSave}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2.5rem'
        }}>
          {/* Column 1: Core Details */}
          <div>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '1rem', color: 'var(--primary)' }}>General Info</h4>
            
            <div className="form-group">
              <label className="form-label">College/University Name</label>
              <input 
                type="text" 
                name="name" 
                className="form-input" 
                value={formData.name} 
                onChange={handleInputChange} 
                disabled={!isEditing} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Faculty/Department</label>
              <input 
                type="text" 
                name="faculty" 
                className="form-input" 
                value={formData.faculty} 
                onChange={handleInputChange} 
                disabled={!isEditing} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Branding Logo URL</label>
              <input 
                type="text" 
                name="logo_url" 
                className="form-input" 
                value={formData.logo_url} 
                onChange={handleInputChange} 
                disabled={!isEditing} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Complete Address</label>
              <textarea 
                name="address" 
                className="form-input" 
                style={{ height: '80px', resize: 'none' }}
                value={formData.address} 
                onChange={handleInputChange} 
                disabled={!isEditing} 
              />
            </div>
          </div>

          {/* Column 2: Signatures & Contact */}
          <div>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '1rem', color: 'var(--primary)' }}>Academic Signatures & Contacts</h4>

            <div className="form-group">
              <label className="form-label">Dean Signature Name</label>
              <input 
                type="text" 
                name="dean_name" 
                className="form-input" 
                value={formData.dean_name} 
                onChange={handleInputChange} 
                disabled={!isEditing} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Dean Title / Department</label>
              <input 
                type="text" 
                name="dean_title" 
                className="form-input" 
                value={formData.dean_title} 
                onChange={handleInputChange} 
                disabled={!isEditing} 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input 
                  type="text" 
                  name="phone" 
                  className="form-input" 
                  value={formData.phone} 
                  onChange={handleInputChange} 
                  disabled={!isEditing} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Email</label>
                <input 
                  type="email" 
                  name="email" 
                  className="form-input" 
                  value={formData.email} 
                  onChange={handleInputChange} 
                  disabled={!isEditing} 
                />
              </div>
            </div>
          </div>

          {/* Column 3: Academic Standards */}
          <div>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '1rem', color: 'var(--primary)' }}>Academic Grade Thresholds</h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Total Exam Marks</label>
                <input 
                  type="number" 
                  name="total_marks" 
                  className="form-input" 
                  value={formData.total_marks} 
                  onChange={handleInputChange} 
                  disabled={!isEditing} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Passing Marks (%)</label>
                <input 
                  type="number" 
                  name="passing_marks" 
                  className="form-input" 
                  value={formData.passing_marks} 
                  onChange={handleInputChange} 
                  disabled={!isEditing} 
                />
              </div>
            </div>

            <div style={{
              marginTop: '1.25rem',
              padding: '1rem',
              borderRadius: '8px',
              background: 'var(--primary-glow)',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)'
            }}>
              <strong>Standard Grading Scale:</strong>
              <ul style={{ margin: '0.5rem 0 0 1.25rem' }}>
                <li>A+ : 90% - 100%</li>
                <li>A : 80% - 89%</li>
                <li>B+ : 75% - 79%</li>
                <li>B : 70% - 74%</li>
                <li>C : 60% - 69%</li>
                <li>Fail (F) : Below Passing Threshold ({formData.passing_marks}%)</li>
              </ul>
            </div>
          </div>
        </div>

        {isEditing && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => {
                setIsEditing(false);
                loadCollegeData();
              }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
            >
              <Save size={16} />
              Save Modifications
            </button>
          </div>
        )}
      </form>

      {!isEditing && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          justifyContent: 'center',
          marginTop: '1.5rem',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '1rem'
        }}>
          <ShieldCheck size={14} style={{ color: 'var(--success)' }} />
          Branding profiles are synchronized with the institutional server
        </div>
      )}
    </div>
  );
};

export default CollegeSettingsView;
