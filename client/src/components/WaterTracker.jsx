import React, { useState, useEffect } from 'react';
import api from '../api';
import { useLanguage } from '../context/LanguageContext';

const WaterTracker = () => {
  const { t } = useLanguage();
  const [waterAmount, setWaterAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const DAILY_GOAL = 2500; // 2.5 Liters

  useEffect(() => {
    fetchWaterIntake();
  }, []);

  const fetchWaterIntake = async () => {
    try {
      const res = await api.get('/water');
      if (res.data && res.data.amount !== undefined) {
        setWaterAmount(res.data.amount);
      }
    } catch (err) {
      console.error('Failed to fetch water intake:', err);
    } finally {
      setLoading(false);
    }
  };

  const addWater = async (amount) => {
    try {
      const res = await api.post('/water', { amountToAdd: amount });
      if (res.data && res.data.amount !== undefined) {
        setWaterAmount(res.data.amount);
      }
    } catch (err) {
      console.error('Failed to add water:', err);
    }
  };

  const resetWater = async () => {
    if (!window.confirm(t("Are you sure you want to reset today's water intake?"))) return;
    try {
      const res = await api.post('/water/reset');
      if (res.data && res.data.amount !== undefined) {
        setWaterAmount(res.data.amount);
      } else {
        setWaterAmount(0);
      }
    } catch (err) {
      console.error('Failed to reset water:', err);
    }
  };

  const calculatePercentage = () => {
    const percentage = (waterAmount / DAILY_GOAL) * 100;
    return percentage > 100 ? 100 : percentage;
  };

  const getFeedbackMessage = () => {
    if (waterAmount >= DAILY_GOAL) return t('You reached your daily goal! 🎉');
    if (waterAmount >= DAILY_GOAL * 0.5) return t("Great job! You're halfway there! 💧");
    if (waterAmount > 0) return t('Good start! Keep drinking 💧');
    return t('Time to hydrate! Drink some water. 💧');
  };

  if (loading) {
    return <div className="card text-center"><p>{t('Loading Water Tracker...')}</p></div>;
  }

  return (
    <div className="card" style={{ marginBottom: '2rem', position: 'relative' }}>
      <h3 style={{ color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>💧</span> {t('Water Intake Tracker')}
      </h3>

      <button 
        onClick={resetWater}
        style={{
          position: 'absolute',
          top: '1.5rem',
          right: '1.5rem',
          background: 'none',
          border: 'none',
          color: '#e74c3c',
          cursor: 'pointer',
          fontSize: '0.9rem',
          textDecoration: 'underline'
        }}
      >
        {t('Reset')}
      </button>
      
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '2.5rem', color: '#1abc9c', margin: '0' }}>
          {waterAmount} / {DAILY_GOAL} {t('ml')}
        </h2>
        <p style={{ color: '#7f8c8d', fontStyle: 'italic', marginTop: '0.5rem' }}>
          {getFeedbackMessage()}
        </p>
      </div>

      <div style={{
        width: '100%',
        backgroundColor: '#e0e0e0',
        borderRadius: '10px',
        overflow: 'hidden',
        height: '24px',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          width: `${calculatePercentage()}%`,
          backgroundColor: '#3498db',
          height: '100%',
          transition: 'width 0.5s ease-in-out'
        }}></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <button 
          onClick={() => addWater(250)}
          className="btn btn-primary" 
          style={{ backgroundColor: '#2980b9', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          <span style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🥤</span>
          {t('+ 250 ml')}
        </button>
        <button 
          onClick={() => addWater(250)} // A glass is usually approx 250ml
          className="btn btn-secondary" 
          style={{ backgroundColor: '#3498db', borderColor: '#3498db', color: 'white', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          <span style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🚰</span>
          {t('+ 1 Glass')}
        </button>
      </div>
    </div>
  );
}

export default WaterTracker;
