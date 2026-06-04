import React, { useEffect, useState } from 'react';
import { base44 } from '../api/base44Client';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import FeeTable from '../components/FeeTable';
import FeeSummaryPanel from '../components/FeeSummaryPanel';
import { DollarSign, Plus, X } from 'lucide-react';

const FeeDashboard = () => {
  const { isAdmin } = useAuth();
  const { triggerToast } = useNotifications();
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    total_fees: '',
    paid_fees: '',
    cashback_paid: ''
  });

  const loadData = async () => {
    try {
      const feeList = await base44.entities.Fee.list();
      const studentList = await base44.entities.Student.list();
      setFees(feeList);
      setStudents(studentList);
    } catch (err) {
      console.error(err);
      triggerToast('Failed to load fee data.', 'danger');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddFee = async (e) => {
    e.preventDefault();
    try {
      if (!formData.student_id || !formData.total_fees) {
        triggerToast('Please fill in required fields', 'warning');
        return;
      }
      
      await base44.entities.Fee.create({
        student_id: formData.student_id,
        total_fees: parseFloat(formData.total_fees),
        paid_fees: parseFloat(formData.paid_fees) || 0,
        cashback_paid: parseFloat(formData.cashback_paid) || 0
      });
      
      triggerToast('Fee record created successfully', 'success');
      setShowAddModal(false);
      setFormData({ student_id: '', total_fees: '', paid_fees: '', cashback_paid: '' });
      loadData();
    } catch (err) {
      console.error(err);
      triggerToast('Failed to create fee record', 'danger');
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Helper to map student info onto fee record
  const enrichedFees = fees.map(f => {
    const stu = students.find(s => s.id === f.student_id) || {};
    return {
      ...f,
      student_name: stu.full_name || '—',
      study_year: stu.study_year || '—',
      gender: stu.gender || '—',
      dob: stu.date_of_birth || '—',
      passport_no: stu.passport_url || '—'
    };
  });

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
          <DollarSign size={20} style={{ marginRight: '0.5rem' }} /> Student Fee Management
        </h2>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Add Fee Record
          </button>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'row', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, overflowX: 'auto', minWidth: 0 }}>
          <FeeTable data={enrichedFees} isAdmin={isAdmin} reload={loadData} />
        </div>
        <div style={{ width: '18rem', flexShrink: 0 }}>
          <FeeSummaryPanel fees={fees} />
        </div>
      </div>

      {/* Add Fee Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '60px 1.5rem 1.5rem 1.5rem',
          zIndex: 9999
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '500px',
            padding: '2rem',
            borderRadius: '16px',
            boxShadow: 'var(--shadow-lg)',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Add Fee Record</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <X size={24} color="var(--text-muted)" />
              </button>
            </div>

            <form onSubmit={handleAddFee} style={{ flex: 1, overflowY: 'auto' }}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Student *</label>
                <select
                  name="student_id"
                  value={formData.student_id}
                  onChange={handleFormChange}
                  className="form-input"
                  required
                >
                  <option value="">Select a student</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Total Fees *</label>
                <input
                  type="number"
                  name="total_fees"
                  value={formData.total_fees}
                  onChange={handleFormChange}
                  placeholder="Enter total fee amount"
                  className="form-input"
                  required
                  step="0.01"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Paid Fees</label>
                <input
                  type="number"
                  name="paid_fees"
                  value={formData.paid_fees}
                  onChange={handleFormChange}
                  placeholder="Enter paid amount"
                  className="form-input"
                  step="0.01"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Cashback Paid</label>
                <input
                  type="number"
                  name="cashback_paid"
                  value={formData.cashback_paid}
                  onChange={handleFormChange}
                  placeholder="Enter cashback amount"
                  className="form-input"
                  step="0.01"
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: '0.75rem 1.5rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '0.75rem 1.5rem' }}
                >
                  Add Fee Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeDashboard;
