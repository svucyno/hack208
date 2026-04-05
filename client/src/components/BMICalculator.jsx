import React, { useState } from 'react';
import { Activity } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const BMICalculator = () => {
  const { t } = useLanguage();
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [result, setResult] = useState(null);

  const calculate = (e) => {
    e.preventDefault();
    if (!weight || !height) return;
    const h = height / 100;
    const bmi = (weight / (h * h)).toFixed(1);
    let category = '';
    if (bmi < 18.5) category = 'Underweight';
    else if (bmi < 25) category = 'Normal';
    else if (bmi < 30) category = 'Overweight';
    else category = 'Obese';
    setResult({ bmi, category });
  };

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto' }} className="card">
      <h2 style={{ color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Activity /> {t('BMI Calculator')}
      </h2>
      <form onSubmit={calculate}>
        <div className="input-group">
          <label>{t('Weight (kg)')}</label>
          <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 70" required />
        </div>
        <div className="input-group">
          <label>{t('Height (cm)')}</label>
          <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="e.g. 175" required />
        </div>
        <button type="submit" className="btn btn-primary">{t('Calculate')}</button>
      </form>
      {result && (
        <div style={{ marginTop: '1.5rem', textAlign: 'center', padding: '1rem', background: '#f9f9f9', borderRadius: 'var(--radius)' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{result.bmi}</div>
          <div style={{ fontWeight: '500' }}>{t('Category:')} {t(result.category)}</div>
        </div>
      )}
    </div>
  );
};

export default BMICalculator;
