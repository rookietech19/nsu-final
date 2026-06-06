import React from 'react';
import { DollarSign, Search, Filter, Download } from 'lucide-react';

const FeeOverview = ({ fees, students }) => {
  // Calculate stats
  const totalCollected = fees.reduce((acc, fee) => acc + (fee.amount_paid || fee.paid_fees || 0), 0);
  const totalFeesAmount = fees.reduce((acc, fee) => acc + (fee.total_amount || fee.total_fees || 0), 0);
  const outstanding = totalFeesAmount - totalCollected;
  
  const pendingCount = fees.filter(f => {
    const total = f.total_amount || f.total_fees || 0;
    const paid = f.amount_paid || f.paid_fees || 0;
    return total > paid;
  }).length;

  return (
    <div className="fee-overview animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Quick Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* Stat Card 1 */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Collected
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center' }}>
            <DollarSign size={28} style={{ color: 'var(--primary)', marginRight: '0.25rem' }} />
            {totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--warning)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Outstanding Fees
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center' }}>
            <DollarSign size={28} style={{ color: 'var(--warning)', marginRight: '0.25rem' }} />
            {outstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--danger)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Pending Payments
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--danger)' }}>
            {pendingCount}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Students with outstanding balances
          </div>
        </div>
      </div>

      {/* Recent Activity or Summary Table */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Fee Collection Progress</h3>
        <div style={{ width: '100%', height: '12px', background: 'var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            background: 'var(--primary)',
            width: `${totalFeesAmount > 0 ? (totalCollected / totalFeesAmount) * 100 : 0}%`,
            transition: 'width 1s ease-in-out'
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          <span>{totalCollected.toLocaleString()} Collected</span>
          <span>{totalFeesAmount.toLocaleString()} Total Target</span>
        </div>
      </div>
    </div>
  );
};

export default FeeOverview;
