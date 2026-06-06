import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign } from 'lucide-react';

const FeeForm = ({ initialData, students, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    student_id: '',
    fee_type: 'tuition',
    total_amount: '',
    amount_paid: '',
    due_date: '',
    payment_method: 'cash',
    notes: '',
    ...initialData // Overwrite with initial data if provided (for edit)
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        // Ensure defaults if old data schema is used
        total_amount: initialData.total_amount ?? initialData.total_fees ?? '',
        amount_paid: initialData.amount_paid ?? initialData.paid_fees ?? ''
      }));
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.student_id) newErrors.student_id = "Student is required";
    if (!formData.fee_type) newErrors.fee_type = "Fee type is required";
    if (!formData.total_amount || parseFloat(formData.total_amount) <= 0) {
      newErrors.total_amount = "Total amount must be greater than 0";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Convert numeric fields
    const submissionData = {
      ...formData,
      total_amount: parseFloat(formData.total_amount) || 0,
      amount_paid: parseFloat(formData.amount_paid) || 0,
    };

    onSave(submissionData);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      zIndex: 9999
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '16px',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign size={20} style={{ color: 'var(--primary)' }} />
            {initialData ? 'Edit Fee Record' : 'Add Fee Record'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Student *</label>
              <select
                name="student_id"
                value={formData.student_id}
                onChange={handleChange}
                className={`form-input ${errors.student_id ? 'error' : ''}`}
                disabled={!!initialData} // Don't allow changing student on edit
              >
                <option value="">Select a student...</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.full_name}</option>
                ))}
              </select>
              {errors.student_id && <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{errors.student_id}</span>}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Fee Type *</label>
              <select
                name="fee_type"
                value={formData.fee_type}
                onChange={handleChange}
                className={`form-input ${errors.fee_type ? 'error' : ''}`}
              >
                <option value="tuition">Tuition Fee</option>
                <option value="lab">Laboratory Fee</option>
                <option value="activities">Activities Fee</option>
                <option value="hostel">Hostel/Accommodation</option>
                <option value="transport">Transport</option>
                <option value="other">Other</option>
              </select>
              {errors.fee_type && <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{errors.fee_type}</span>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Total Amount ($) *</label>
              <input
                type="number"
                name="total_amount"
                value={formData.total_amount}
                onChange={handleChange}
                className={`form-input ${errors.total_amount ? 'error' : ''}`}
                placeholder="0.00"
                step="0.01"
              />
              {errors.total_amount && <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{errors.total_amount}</span>}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Amount Paid ($)</label>
              <input
                type="number"
                name="amount_paid"
                value={formData.amount_paid}
                onChange={handleChange}
                className="form-input"
                placeholder="0.00"
                step="0.01"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Due Date</label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Payment Method</label>
              <select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
                className="form-input"
              >
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="online">Online Transfer</option>
                <option value="card">Credit/Debit Card</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Notes / Remarks</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="form-input"
              placeholder="Any additional details..."
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Save size={16} />
              {initialData ? 'Save Changes' : 'Create Record'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default FeeForm;
