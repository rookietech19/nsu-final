import React, { useState } from 'react';
import { Search, Filter, Edit, Trash2, ChevronRight, Eye } from 'lucide-react';

const FeeList = ({ fees, students, isAdmin, onEdit, onDelete, onViewDetails }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Enriched fee data
  const enrichedFees = fees.map(f => {
    const stu = students.find(s => s.id === f.student_id) || {};
    const total = f.total_amount || f.total_fees || 0;
    const paid = f.amount_paid || f.paid_fees || 0;
    const balance = total - paid;
    
    let status = 'Pending';
    if (balance <= 0) status = 'Paid';
    else if (paid > 0) status = 'Partial';
    
    return {
      ...f,
      student_name: f.student_name || stu.full_name || '—',
      batch: f.batch || stu.study_year || '—',
      total_amount: total,
      amount_paid: paid,
      outstanding_amount: balance,
      calculated_status: status
    };
  });

  // Filter and sort
  const filteredFees = enrichedFees.filter(fee => {
    const matchesSearch = fee.student_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (fee.student_id && fee.student_id.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || fee.calculated_status.toLowerCase() === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="fee-list-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* Top Toolbar */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search student name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Filter size={18} style={{ color: 'var(--text-muted)' }} />
          <select 
            className="form-input" 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="glass-panel table-container" style={{ overflowX: 'auto' }}>
        <table className="table-main" style={{ width: '100%', minWidth: 0 }}>
          <thead>
            <tr>
              <th className="table-th">Student</th>
              <th className="table-th">Batch/Year</th>
              <th className="table-th">Fee Type</th>
              <th className="table-th" style={{ textAlign: 'right' }}>Total</th>
              <th className="table-th" style={{ textAlign: 'right' }}>Paid</th>
              <th className="table-th" style={{ textAlign: 'right' }}>Balance</th>
              <th className="table-th" style={{ textAlign: 'center' }}>Status</th>
              <th className="table-th" style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFees.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No fee records found.
                </td>
              </tr>
            ) : filteredFees.map((fee) => {
              
              let statusColor = 'var(--danger)';
              let statusBg = 'var(--danger-glow)';
              if (fee.calculated_status === 'Paid') {
                statusColor = 'var(--success)';
                statusBg = 'var(--success-glow)';
              } else if (fee.calculated_status === 'Partial') {
                statusColor = 'var(--warning)';
                statusBg = 'var(--warning-glow)';
              }

              return (
                <tr key={fee.id} className="table-row">
                  <td className="table-td">
                    <div style={{ fontWeight: 600 }}>{fee.student_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{fee.student_id}</div>
                  </td>
                  <td className="table-td">{fee.batch}</td>
                  <td className="table-td" style={{ textTransform: 'capitalize' }}>{fee.fee_type || 'Tuition'}</td>
                  <td className="table-td" style={{ textAlign: 'right', fontWeight: 500 }}>
                    ${fee.total_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="table-td" style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                    ${fee.amount_paid?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="table-td" style={{ textAlign: 'right', fontWeight: 600 }}>
                    ${fee.outstanding_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="table-td" style={{ textAlign: 'center' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: statusColor,
                      backgroundColor: statusBg
                    }}>
                      {fee.calculated_status}
                    </span>
                  </td>
                  <td className="table-td" style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                      <button onClick={() => onViewDetails(fee)} className="btn btn-secondary" style={{ padding: '0.4rem' }} title="View Details">
                        <Eye size={16} />
                      </button>
                      {isAdmin && (
                        <>
                          <button onClick={() => onEdit(fee)} className="btn btn-secondary" style={{ padding: '0.4rem' }} title="Edit">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => onDelete(fee.id)} className="btn btn-danger" style={{ padding: '0.4rem' }} title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
    </div>
  );
};

export default FeeList;
