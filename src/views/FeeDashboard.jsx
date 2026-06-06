import React, { useEffect, useState } from 'react';
import { DollarSign, LayoutDashboard, List, Upload, BarChart2, Plus } from 'lucide-react';
import { base44 } from '../api/base44Client';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

// Import subcomponents
import FeeOverview from '../components/FeeModule/FeeOverview';
import FeeList from '../components/FeeModule/FeeList';
import FeeForm from '../components/FeeModule/FeeForm';
import FeeImport from '../components/FeeModule/FeeImport';
import FeeReports from '../components/FeeModule/FeeReports';

const FeeDashboard = () => {
  const { isAdmin } = useAuth();
  const { triggerToast } = useNotifications();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingFee, setEditingFee] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const feeList = await base44.entities.Fee.list();
      const studentList = await base44.entities.Student.list();
      setFees(feeList);
      setStudents(studentList);
    } catch (err) {
      console.error(err);
      triggerToast('Failed to load fee data.', 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveFee = async (formData) => {
    try {
      if (editingFee) {
        await base44.entities.Fee.update(editingFee.id, formData);
        triggerToast('Fee record updated successfully', 'success');
      } else {
        await base44.entities.Fee.create(formData);
        triggerToast('Fee record created successfully', 'success');
      }
      setShowForm(false);
      setEditingFee(null);
      loadData();
    } catch (err) {
      console.error(err);
      triggerToast('Failed to save fee record', 'danger');
    }
  };

  const handleDeleteFee = async (feeId) => {
    if (!window.confirm('Delete this fee record? This action cannot be undone.')) return;
    try {
      await base44.entities.Fee.delete(feeId);
      triggerToast('Fee record deleted successfully', 'success');
      loadData();
    } catch (err) {
      console.error(err);
      triggerToast('Failed to delete fee record', 'danger');
    }
  };

  const handleEditFee = (fee) => {
    setEditingFee(fee);
    setShowForm(true);
  };

  const handleViewDetails = (fee) => {
    // For now, view details opens the edit form with no save button if not admin,
    // or we could just jump to edit mode for admins.
    setEditingFee(fee);
    setShowForm(true);
  };

  const handleImportCSV = async (parsedData) => {
    setIsImporting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Basic sequential creation for safety
      for (const row of parsedData) {
        try {
          // Check if student exists
          const student = students.find(s => 
            s.id === row.student_id || 
            (s.full_name && s.full_name.toLowerCase() === row.student_id.toLowerCase())
          );
          
          const actualStudentId = student ? student.id : row.student_id;

          await base44.entities.Fee.create({
            student_id: actualStudentId,
            fee_type: row.fee_type,
            total_amount: parseFloat(row.amount),
            amount_paid: 0,
            due_date: row.due_date || null
          });
          successCount++;
        } catch (e) {
          console.error('Failed to import row', row, e);
          errorCount++;
        }
      }
      
      triggerToast(`Import complete: ${successCount} imported, ${errorCount} failed.`, errorCount > 0 ? 'warning' : 'success');
      setActiveTab('list');
      loadData();
    } catch (err) {
      console.error(err);
      triggerToast('Critical error during import.', 'danger');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fee-dashboard-wrapper animate-fade-in" style={{ padding: '0', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <DollarSign size={28} style={{ color: 'var(--primary)' }} /> 
            Fee Management
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
            Monitor, collect, and analyze student fees.
          </p>
        </div>

        {isAdmin && activeTab !== 'import' && activeTab !== 'reports' && (
          <button className="btn btn-primary" onClick={() => { setEditingFee(null); setShowForm(true); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} /> Add Fee Record
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginBottom: '2rem',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '1rem',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        <TabButton icon={<LayoutDashboard size={18} />} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
        <TabButton icon={<List size={18} />} label="Fee List" active={activeTab === 'list'} onClick={() => setActiveTab('list')} />
        {isAdmin && <TabButton icon={<Upload size={18} />} label="Import CSV" active={activeTab === 'import'} onClick={() => setActiveTab('import')} />}
        <TabButton icon={<BarChart2 size={18} />} label="Reports" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
      </div>

      {/* Main Content Area */}
      <div style={{ position: 'relative', minHeight: '400px' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
            <div className="animate-pulse" style={{ color: 'var(--primary)', fontWeight: 600 }}>Loading Fee Data...</div>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && <FeeOverview fees={fees} students={students} />}
            {activeTab === 'list' && (
              <FeeList 
                fees={fees} 
                students={students} 
                isAdmin={isAdmin} 
                onEdit={handleEditFee}
                onDelete={handleDeleteFee}
                onViewDetails={handleViewDetails}
              />
            )}
            {activeTab === 'import' && isAdmin && (
              <FeeImport onImport={handleImportCSV} isImporting={isImporting} />
            )}
            {activeTab === 'reports' && (
              <FeeReports fees={fees} students={students} />
            )}
          </>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <FeeForm 
          initialData={editingFee} 
          students={students} 
          onClose={() => { setShowForm(false); setEditingFee(null); }} 
          onSave={handleSaveFee} 
        />
      )}

    </div>
  );
};

// Helper component for tabs
const TabButton = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.75rem 1.25rem',
      background: active ? 'var(--primary)' : 'transparent',
      color: active ? '#fff' : 'var(--text-muted)',
      border: 'none',
      borderRadius: '8px',
      fontSize: '0.9rem',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      whiteSpace: 'nowrap'
    }}
  >
    {icon}
    {label}
  </button>
);

export default FeeDashboard;
