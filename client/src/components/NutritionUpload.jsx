import React, { useState } from 'react';
import api from '../api';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const NutritionUpload = () => {
  const { t } = useLanguage();
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
    setStatus('');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError(t('Please select a file first.'));
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setError('');
    setStatus('');

    try {
      const res = await api.post('/nutrition/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStatus(res.data.message);
      setFile(null);
      // Reset file input
      document.getElementById('file-upload').value = '';
    } catch (err) {
      setError(err.response?.data?.message || t('Failed to upload file. Ensure it is a valid XLSX or CSV.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '3rem auto', padding: '2rem', background: 'white', borderRadius: 'var(--radius)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2c3e50' }}>
        <FileText color="var(--primary)" /> {t('Food Nutrition Intelligence')}
      </h2>
      
      <p style={{ marginBottom: '2rem', color: '#7f8c8d', fontSize: '0.9rem' }}>
        {t('Upload an Excel (.xlsx) or CSV file containing food items and their nutritional values (calories, protein, carbs, fats).')}
      </p>

      <form onSubmit={handleUpload}>
        <div style={{ 
          border: '2px dashed #ddd', 
          padding: '2rem', 
          textAlign: 'center', 
          borderRadius: 'var(--radius)',
          marginBottom: '1.5rem',
          cursor: 'pointer',
          background: file ? '#f1f8e9' : 'transparent'
        }} onClick={() => document.getElementById('file-upload').click()}>
          <Upload size={48} color="#bdc3c7" style={{ marginBottom: '1rem' }} />
          <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>
            {file ? file.name : t('Click to select or drag and drop')}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#bdc3c7', marginTop: '0.5rem' }}>
            {t('Supports XLSX and CSV formats')}
          </div>
          <input 
            id="file-upload"
            type="file" 
            accept=".xlsx,.xls,.csv" 
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e74c3c', marginBottom: '1rem', padding: '0.75rem', background: '#fdeded', borderRadius: 'var(--radius)', fontSize: '0.9rem' }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {status && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#27ae60', marginBottom: '1rem', padding: '0.75rem', background: '#e8f5e9', borderRadius: 'var(--radius)', fontSize: '0.9rem' }}>
            <CheckCircle size={18} /> {status}
          </div>
        )}

        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={loading || !file}
          style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
        >
          {loading ? t('Processing File...') : t('Upload Data')}
        </button>
      </form>
    </div>
  );
};

export default NutritionUpload;
