import React from 'react';
import { DollarSign, CreditCard, Calendar } from 'lucide-react';

/**
 * FeeSummaryPanel - displays summary cards for the fee dashboard.
 * Props:
 *   fees: array of fee records (raw, not enriched).
 */
const FeeSummaryPanel = ({ fees }) => {
  // Guard against empty array
  const feeList = fees || [];

  const totalFees = feeList.reduce((sum, f) => sum + (f.total_fees || 0), 0);
  const paidFees = feeList.reduce((sum, f) => sum + (f.paid_fees || 0), 0);
  const balanceFees = totalFees - paidFees;
  const cashbackPaid = feeList.reduce((sum, f) => sum + (f.cashback_paid || 0), 0);

  // Cashback eligible amount – for demo we assume 10% of total fees as eligible.
  const cashbackEligible = Math.floor(totalFees * 0.1);
  const cashbackPending = cashbackEligible - cashbackPaid;

  const currentYear = new Date().getFullYear();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Cashback Information Card */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <DollarSign size={20} style={{ color: 'var(--primary)' }} />
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Cashback Information</h3>
        </div>
        <div style={{ marginTop: '0.75rem' }}>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            <strong>Eligible Amount:</strong> ${cashbackEligible.toLocaleString()}
          </p>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            <strong>Paid:</strong> ${cashbackPaid.toLocaleString()}
          </p>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            <strong>Pending:</strong> ${cashbackPending > 0 ? cashbackPending.toLocaleString() : 0}
          </p>
        </div>
      </div>

      {/* Cash Received Card */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CreditCard size={20} style={{ color: 'var(--primary)' }} />
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Cash Received</h3>
        </div>
        <div style={{ marginTop: '0.75rem' }}>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            <strong>Total Received:</strong> ${paidFees.toLocaleString()}
          </p>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            <strong>Received By:</strong> System (auto)
          </p>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            <strong>Date:</strong> {new Date().toISOString().split('T')[0]}
          </p>
        </div>
      </div>

      {/* Year End Summary Card */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Calendar size={20} style={{ color: 'var(--primary)' }} />
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{currentYear} Year‑End Summary</h3>
        </div>
        <div style={{ marginTop: '0.75rem' }}>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            <strong>Total Gross:</strong> ${totalFees.toLocaleString()}
          </p>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            <strong>Total Paid:</strong> ${paidFees.toLocaleString()}
          </p>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            <strong>Outstanding Balance:</strong> ${balanceFees.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FeeSummaryPanel;
