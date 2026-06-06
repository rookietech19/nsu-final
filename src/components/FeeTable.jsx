import React, { useState } from 'react';
import { Edit, Trash2, X } from 'lucide-react';
import { base44 } from '../api/base44Client';
import { useNotifications } from '../context/NotificationContext';

/**
 * FeeTable - displays a responsive table of fee records.
 * Props:
 *  - data: array of enriched fee objects (including student details).
 *  - isAdmin: boolean indicating if current user can edit/delete.
 *  - reload: function to refresh data after mutations.
 */
const FeeTable = ({ data, isAdmin, reload }) => {
  const { triggerToast } = useNotifications();
  const [editingFee, setEditingFee] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  const handleEdit = (fee) => {
    setEditingFee(fee);
    setEditFormData({
      total_fees: fee.total_fees || 0,
      paid_fees: fee.paid_fees || 0,
      cashback_paid: fee.cashback_paid || 0
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await base44.entities.Fee.update(editingFee.id, {
        total_fees: parseFloat(editFormData.total_fees),
        paid_fees: parseFloat(editFormData.paid_fees),
        cashback_paid: parseFloat(editFormData.cashback_paid)
      });
      triggerToast('Fee record updated successfully', 'success');
      setEditingFee(null);
      reload();
    } catch (err) {
      console.error(err);
      triggerToast('Failed to update fee record', 'danger');
    }
  };

  const handleDelete = async (feeId) => {
    if (!window.confirm('Delete this fee record? This action cannot be undone.')) return;
    try {
      await base44.entities.Fee.delete(feeId);
      triggerToast('Fee record deleted successfully', 'success');
      reload();
    } catch (err) {
      console.error(err);
      triggerToast('Failed to delete fee record', 'danger');
    }
  };

  return (
    <div className="glass-panel animate-fade-in table-container" style={{ overflowX: 'auto' }}>
      <table className="table-main" style={{ width: '100%', minWidth: 0 }}>
        <thead>
          <tr>
            <th className="table-th">Student Name</th>
            <th className="table-th">Year</th>
            <th className="table-th">Gender</th>
            <th className="table-th">DOB</th>
            <th className="table-th">Passport #</th>
            <th className="table-th" style={{ textAlign: 'right' }}>Total Fees</th>
            <th className="table-th" style={{ textAlign: 'right' }}>Paid Fees</th>
            <th className="table-th" style={{ textAlign: 'right' }}>Balance</th>
            <th className="table-th" style={{ textAlign: 'right' }}>Cashback Paid</th>
            <th className="table-th" style={{ textAlign: 'center' }}>Status</th>
            {isAdmin && <th className="table-th" style={{ textAlign: 'center' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((fee) => {
            const balance = (fee.total_fees || 0) - (fee.paid_fees || 0);
            let statusColor = 'var(--danger)';
            let statusLabel = 'Pending';
            if (balance === 0) {
              statusColor = 'var(--success)';
              statusLabel = 'Fully Paid';
            } else if (fee.paid_fees > 0) {
              statusColor = 'var(--warning)';
              statusLabel = 'Partially Paid';
            }
            return (
              <tr key={fee.id} className="table-row">
                <td className="table-td">{fee.student_name}</td>
                <td className="table-td">{fee.study_year || '—'}</td>
                <td className="table-td">{fee.gender || '—'}</td>
                <td className="table-td">{fee.dob || '—'}</td>
                <td className="table-td">{fee.passport_no || '—'}</td>
                <td className="table-td" style={{ textAlign: 'right' }}>{fee.total_fees?.toLocaleString() ?? '0'}</td>
                <td className="table-td" style={{ textAlign: 'right' }}>{fee.paid_fees?.toLocaleString() ?? '0'}</td>
                <td className="table-td" style={{ textAlign: 'right' }}>{balance?.toLocaleString() ?? '0'}</td>
                <td className="table-td" style={{ textAlign: 'right' }}>{fee.cashback_paid?.toLocaleString() ?? '0'}</td>
                <td className="table-td" style={{ textAlign: 'center', color: statusColor, fontWeight: 600 }}>{statusLabel}</td>
                {isAdmin && (
                  <td className="table-td" style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => handleEdit(fee)}
                      className="btn btn-secondary"
                      style={{ marginRight: '0.4rem' }}
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(fee.id)}
                      className="btn btn-danger"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Edit Fee Modal */}
      {editingFee && (
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
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                Edit Fee Record - {editingFee.student_name}
              </h3>
              <button onClick={() => setEditingFee(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <X size={24} color="var(--text-muted)" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ flex: 1, overflowY: 'auto' }}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Total Fees</label>
                <input
                  type="number"
                  name="total_fees"
                  value={editFormData.total_fees}
                  onChange={handleEditChange}
                  className="form-input"
                  step="0.01"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Paid Fees</label>
                <input
                  type="number"
                  name="paid_fees"
                  value={editFormData.paid_fees}
                  onChange={handleEditChange}
                  className="form-input"
                  step="0.01"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Cashback Paid</label>
                <input
                  type="number"
                  name="cashback_paid"
                  value={editFormData.cashback_paid}
                  onChange={handleEditChange}
                  className="form-input"
                  step="0.01"
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setEditingFee(null)}
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
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeTable;
