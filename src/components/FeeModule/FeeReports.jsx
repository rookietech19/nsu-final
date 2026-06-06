import React, { useState } from 'react';
import { Download, Calendar, Filter, PieChart, TrendingUp } from 'lucide-react';

const FeeReports = ({ fees, students }) => {
  const [reportType, setReportType] = useState('summary');
  const [dateRange, setDateRange] = useState('all');

  // Basic aggregate logic for summary
  const totalFeesAmount = fees.reduce((acc, fee) => acc + (fee.total_amount || fee.total_fees || 0), 0);
  const totalCollected = fees.reduce((acc, fee) => acc + (fee.amount_paid || fee.paid_fees || 0), 0);
  const outstanding = totalFeesAmount - totalCollected;

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (reportType === 'summary') {
      csvContent += "Metric,Amount\n";
      csvContent += `Total Target Amount,${totalFeesAmount}\n`;
      csvContent += `Total Collected,${totalCollected}\n`;
      csvContent += `Total Outstanding,${outstanding}\n`;
    } else {
      csvContent += "Student Name,Student ID,Batch,Fee Type,Total Amount,Paid Amount,Outstanding,Status\n";
      fees.forEach(fee => {
        const stu = students.find(s => s.id === fee.student_id) || {};
        const name = (fee.student_name || stu.full_name || 'Unknown').replace(/,/g, '');
        const id = fee.student_id || 'Unknown';
        const batch = (fee.batch || stu.study_year || '—').replace(/,/g, '');
        const type = fee.fee_type || 'tuition';
        const total = fee.total_amount || fee.total_fees || 0;
        const paid = fee.amount_paid || fee.paid_fees || 0;
        const bal = total - paid;
        const stat = bal <= 0 ? 'Paid' : (paid > 0 ? 'Partial' : 'Pending');
        
        csvContent += `${name},${id},${batch},${type},${total},${paid},${bal},${stat}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `fee_report_${reportType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fee-reports animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Report Controls */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0, minWidth: '200px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PieChart size={14} /> Report Type
            </label>
            <select className="form-input" value={reportType} onChange={(e) => setReportType(e.target.value)}>
              <option value="summary">High-Level Summary</option>
              <option value="detailed">Detailed Student Report</option>
            </select>
          </div>
          
          <div className="form-group" style={{ marginBottom: 0, minWidth: '200px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={14} /> Date Range
            </label>
            <select className="form-input" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
              <option value="all">All Time</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_year">This Year</option>
            </select>
          </div>
        </div>

        <button onClick={handleExportCSV} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}>
          <Download size={18} />
          Export to CSV
        </button>
      </div>

      {/* Report Preview */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={20} style={{ color: 'var(--primary)' }} />
          {reportType === 'summary' ? 'Summary Report Preview' : 'Detailed Report Preview'}
        </h3>
        
        {reportType === 'summary' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div style={{ padding: '1.5rem', background: 'var(--bg-gradient)', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>Total Target Amount</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>${totalFeesAmount.toLocaleString()}</div>
            </div>
            <div style={{ padding: '1.5rem', background: 'var(--bg-gradient)', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>Total Collected</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>${totalCollected.toLocaleString()}</div>
            </div>
            <div style={{ padding: '1.5rem', background: 'var(--bg-gradient)', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>Total Outstanding</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--warning)' }}>${outstanding.toLocaleString()}</div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <Filter size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p style={{ margin: 0 }}>The detailed report contains {fees.length} records.</p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Click "Export to CSV" to download the full detailed report.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default FeeReports;
