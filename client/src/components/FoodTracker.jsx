import React, { useState, useEffect } from 'react';
import api from '../api';
import { Utensils, Trash2, PlusCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const FoodTracker = ({ dailyTarget }) => {
  const { t } = useLanguage();
  const [logs, setLogs] = useState([]);
  const [foodName, setFoodName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/foodlog');
      setLogs(res.data.logs || []);
    } catch (err) {
      console.error('Error fetching food logs:', err);
    }
  };

  const handleAddFood = async (e) => {
    e.preventDefault();
    if (!foodName.trim()) return;
    
    setLoading(true);
    try {
      const res = await api.post('/foodlog', { foodName });
      setLogs([...logs, res.data]);
      setFoodName('');
    } catch (err) {
      console.error('Error adding food:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFood = async (id) => {
    try {
      await api.delete(`/foodlog/${id}`);
      setLogs(logs.filter(log => log.id !== id));
    } catch (err) {
      console.error('Error deleting food:', err);
    }
  };

  const totalCalories = logs.reduce((sum, log) => sum + log.calories, 0);
  const exceedsTarget = dailyTarget && totalCalories > dailyTarget;

  return (
    <div className="card" style={{ marginBottom: '2rem' }}>
      <h3 style={{ color: '#e67e22', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Utensils size={20} /> {t('Daily Food Tracker')}
      </h3>

      <form onSubmit={handleAddFood} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <input
          type="text"
          placeholder={t("e.g. Rice, 2 Eggs, Apple")}
          value={foodName}
          onChange={(e) => setFoodName(e.target.value)}
          style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid #ddd', background: 'transparent', color: 'var(--text-main)', outline: 'none' }}
          disabled={loading}
        />
        <button 
          type="submit" 
          disabled={loading || !foodName.trim()}
          style={{
            background: '#e67e22', border: 'none', color: 'white', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600
          }}
        >
          <PlusCircle size={18} /> {loading ? t('Adding...') : t('Add Food')}
        </button>
      </form>

      <div style={{ background: 'var(--background)', borderRadius: 'var(--radius)', padding: '1rem', minHeight: '100px', maxHeight: '250px', overflowY: 'auto' }}>
        {logs.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', margin: '2rem 0' }}>{t('No foods logged yet today.')}</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {logs.map(log => (
              <li key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <div>
                  <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{log.foodName}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '0.5rem' }}>• {log.calories} kcal</span>
                </div>
                <button 
                  onClick={() => handleDeleteFood(log.id)}
                  style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', padding: '0.25rem' }}
                  title="Remove log"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px dashed #eee', paddingTop: '1rem' }}>
        <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-main)' }}>{t('Total Intake:')}</span>
        <span style={{ fontWeight: 'bold', fontSize: '1.25rem', color: exceedsTarget ? '#e74c3c' : 'var(--primary)' }}>
          {totalCalories} <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>{t('kcal')}</span> {dailyTarget && `/ ${dailyTarget}`}
        </span>
      </div>
      {exceedsTarget && (
        <p style={{ color: '#e74c3c', fontSize: '0.85rem', marginTop: '0.5rem', textAlign: 'right' }}>
          {t('⚠️ You have exceeded your daily target.')}
        </p>
      )}
    </div>
  );
};

export default FoodTracker;
