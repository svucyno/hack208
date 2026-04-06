import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Activity, Flame, Utensils, Info, Moon, Sun } from 'lucide-react';
import WaterTracker from './WaterTracker';
import FoodTracker from './FoodTracker';
import { useLanguage } from '../context/LanguageContext';


const Dashboard = () => {
  const [dietPlan, setDietPlan] = useState(null);
  const [bmiData, setBmiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [streakData, setStreakData] = useState({ count: 1, message: '' });
  const [profile, setProfile] = useState(null);

  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, dietRes, bmiRes, waterRes, streakRes] = await Promise.all([
          api.get('/profile'),
          api.get('/diet/plan'),
          api.get('/diet/bmi'),
          api.get('/water'),
          api.post('/streak/update')
        ]);
        setProfile(profileRes.data);
        setDietPlan(dietRes.data);
        setBmiData(bmiRes.data);
        setStreakData(streakRes.data);
      } catch (err) {
        setError('Failed to fetch dashboard data. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
    if (newMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>{t('Optimizing your nutrition plan...')}</div>;

  if (error) return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <p style={{ color: '#e74c3c' }}>{error}</p>
      <button className="btn btn-primary" style={{ marginTop: '1rem', width: 'auto' }} onClick={() => window.location.href = '/profile'}>
        {t('Complete Profile')}
      </button>
    </div>
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Healthy Morning!';
    if (hour >= 12 && hour < 17) return 'Healthy Afternoon!';
    if (hour >= 17 && hour < 21) return 'Healthy Evening!';
    return 'Healthy Night!'; // Covers 9 PM (21) to 4:59 AM
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--text-main)', margin: '0' }}>{t(getGreeting())}</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          
          <div className="streak-badge" title={streakData?.message || 'Daily Streak'}>
            <span className="fire-icon">🔥</span>
            <span>{t('Streak:')} {streakData?.count || 1} {streakData?.count === 1 ? t('day') : t('days')}</span>
          </div>

          <button 
            onClick={toggleDarkMode}
            style={{
              background: 'var(--card-bg)',
              border: '1px solid #ddd',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--text-main)',
              boxShadow: 'var(--shadow)',
              transition: 'background-color 0.3s ease, color 0.3s ease'
            }}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            {isDarkMode ? t('Light Mode') : t('Dark Mode') + ' 🌙'}
          </button>
          
          {profile?.avatar && (
            <div
              className="avatar-circle-sm"
              onClick={() => navigate('/profile')}
              title="Edit Profile"
            >
              <img src={profile.avatar} alt="Avatar" />
            </div>
          )}
        </div>
      </div>
      
      <div className="dashboard-grid">
        <div className="stat-card">
          <Activity color="var(--primary)" size={32} />
          <h3 style={{ margin: '1rem 0 0.5rem' }}>{t('BMI Status')}</h3>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{bmiData.bmi}</div>
          <div style={{ color: '#7f8c8d' }}>{bmiData.category}</div>
        </div>

        <div className="stat-card">
          <Flame color="#e67e22" size={32} />
          <h3 style={{ margin: '1rem 0 0.5rem' }}>{t('Daily Target')}</h3>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{dietPlan.tdee}</div>
          <div style={{ color: '#7f8c8d' }}>{t('kcal / day')}</div>
        </div>

        <div className="stat-card">
          <Utensils color="#3498db" size={32} />
          <h3 style={{ margin: '1rem 0 0.5rem' }}>{t('Plan Intake')}</h3>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{dietPlan.totalCalories}</div>
          <div style={{ color: '#7f8c8d' }}>{t('kcal planned')}</div>
        </div>
      </div>

      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Utensils color="var(--primary)" /> {t("Today's Meal Plan")}
        </h2>
        
        <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {Object.entries(dietPlan.meals).map(([meal, data]) => (
            <div key={meal} className="diet-card" style={{ borderLeft: '4px solid #2ecc71', display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%' }}>
              <h4 style={{ textTransform: 'capitalize', color: '#7f8c8d', margin: 0 }}>{meal}</h4>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{data.name}</div>
              <div style={{ color: '#27ae60', fontSize: '0.9rem', marginTop: 'auto' }}>{data.calories} kcal</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        <FoodTracker dailyTarget={dietPlan?.totalCalories} />
        <WaterTracker />
      </div>

      <div style={{ 
        marginTop: '3rem', 
        background: isDarkMode ? 'rgba(46, 204, 113, 0.1)' : '#e8f5e9', 
        padding: '1.5rem', 
        borderRadius: 'var(--radius)', 
        display: 'flex', 
        gap: '1rem',
        border: isDarkMode ? '1px solid rgba(46, 204, 113, 0.2)' : 'none'
      }}>
        <Info color="#27ae60" />
        <div>
          <h4 style={{ color: '#2c3e50' }}>{t('Health Tip')}</h4>
          <p style={{ color: '#27ae60', marginTop: '0.25rem' }}>{t('Drinking a glass of water before each meal can help improve digestion and control portions.')}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
