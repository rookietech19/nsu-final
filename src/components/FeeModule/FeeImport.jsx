import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, Play, XCircle } from 'lucide-react';

const FeeImport = ({ onImport, isImporting }) => {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'text/csv') {
      processFile(droppedFile);
    } else {
      alert('Please upload a valid CSV file.');
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = (file) => {
    setFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) {
      setErrors(['CSV file must contain a header row and at least one data row.']);
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const expectedHeaders = ['student_id', 'fee_type', 'amount'];
    
    // Check missing headers
    const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      setErrors([`Missing required headers: ${missingHeaders.join(', ')}`]);
      return;
    }

    const parsedData = [];
    const validationErrors = [];

    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i].split(',').map(v => v.trim());
      if (currentLine.length !== headers.length) {
        validationErrors.push(`Row ${i + 1}: Column count mismatch.`);
        continue;
      }

      const rowData = {};
      headers.forEach((header, index) => {
        rowData[header] = currentLine[index];
      });

      // Validations
      if (!rowData.student_id) validationErrors.push(`Row ${i + 1}: Missing student_id.`);
      if (!rowData.fee_type) validationErrors.push(`Row ${i + 1}: Missing fee_type.`);
      
      const amount = parseFloat(rowData.amount);
      if (isNaN(amount) || amount <= 0) {
        validationErrors.push(`Row ${i + 1}: Invalid amount '${rowData.amount}'.`);
      } else {
        rowData.amount = amount;
      }

      parsedData.push(rowData);
    }

    setPreviewData(parsedData);
    setErrors(validationErrors);
  };

  const executeImport = () => {
    if (!previewData || errors.length > 0) return;
    onImport(previewData);
  };

  const resetState = () => {
    setFile(null);
    setPreviewData(null);
    setErrors([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fee-import animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {!file ? (
        <div 
          className="glass-panel"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          style={{
            border: '2px dashed var(--border-color)',
            padding: '4rem 2rem',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={48} style={{ color: 'var(--primary)', marginBottom: '1rem', opacity: 0.8 }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Upload CSV File</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Drag and drop your fee records CSV here, or click to browse.</p>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle size={14} /> student_id</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle size={14} /> fee_type</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle size={14} /> amount</span>
          </div>

          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={handleFileSelect}
          />
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <FileText size={32} style={{ color: 'var(--primary)' }} />
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{file.name}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {(file.size / 1024).toFixed(2)} KB • {previewData ? previewData.length : 0} rows found
                </span>
              </div>
            </div>
            <button onClick={resetState} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
              Cancel
            </button>
          </div>

          {errors.length > 0 && (
            <div style={{ background: 'var(--danger-glow)', borderLeft: '4px solid var(--danger)', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', fontWeight: 700, marginBottom: '0.5rem' }}>
                <AlertTriangle size={18} /> Validation Errors ({errors.length})
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                {errors.slice(0, 5).map((err, idx) => (
                  <li key={idx} style={{ marginBottom: '0.25rem' }}>{err}</li>
                ))}
                {errors.length > 5 && <li>...and {errors.length - 5} more errors.</li>}
              </ul>
            </div>
          )}

          {previewData && errors.length === 0 && (
            <>
              <div style={{ background: 'var(--success-glow)', borderLeft: '4px solid var(--success)', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={18} style={{ color: 'var(--success)' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>File is valid and ready to import.</span>
              </div>
              
              <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
                <table className="table-main" style={{ width: '100%', fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th className="table-th">Student ID</th>
                      <th className="table-th">Fee Type</th>
                      <th className="table-th" style={{ textAlign: 'right' }}>Amount</th>
                      <th className="table-th">Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="table-row">
                        <td className="table-td" style={{ fontWeight: 600 }}>{row.student_id}</td>
                        <td className="table-td" style={{ textTransform: 'capitalize' }}>{row.fee_type}</td>
                        <td className="table-td" style={{ textAlign: 'right' }}>${row.amount.toLocaleString()}</td>
                        <td className="table-td">{row.due_date || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewData.length > 5 && (
                  <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem', background: 'var(--card-bg)' }}>
                    Showing 5 of {previewData.length} rows
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  onClick={executeImport} 
                  className="btn btn-primary" 
                  disabled={isImporting}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 2rem' }}
                >
                  {isImporting ? (
                    <span className="animate-pulse">Importing...</span>
                  ) : (
                    <>
                      <Play size={18} />
                      Start Import
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default FeeImport;
