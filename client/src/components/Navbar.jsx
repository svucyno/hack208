import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Apple, LayoutDashboard, User, MessageSquare, LogOut, Activity, Upload, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();

  return (
    <nav style={{
      background: 'white',
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--primary)' }}>
        <Apple /> {t('Nutri AI')}
      </div>
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <Link to="/" className="nav-link"><LayoutDashboard size={20} title={t('Dashboard')} /></Link>
        <Link to="/chat" className="nav-link"><MessageSquare size={20} title={t('Chatbot')} /></Link>
        <Link to="/bmi" className="nav-link"><Activity size={20} title={t('BMI Calculator')} /></Link>
        <Link to="/nutrition" className="nav-link"><Upload size={20} title={t('Upload Data')} /></Link>
        <Link to="/profile" className="nav-link"><User size={20} title={t('Profile')} /></Link>
        
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Globe size={16} color="var(--primary)" style={{ position: 'absolute', left: '10px', pointerEvents: 'none' }} />
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{ 
              border: '1px solid #ddd', background: 'transparent', cursor: 'pointer',
              padding: '0.3rem 2rem 0.3rem 2rem', borderRadius: '20px', 
              fontWeight: '600', color: 'var(--text-main)', 
              appearance: 'none', outline: 'none'
            }}
            title={t('Select Language')}
          >
            <option value="en" style={{ background: 'var(--card-bg)', color: 'var(--text-main)' }}>English</option>
            <option value="hi" style={{ background: 'var(--card-bg)', color: 'var(--text-main)' }}>हिंदी</option>
            <option value="te" style={{ background: 'var(--card-bg)', color: 'var(--text-main)' }}>తెలుగు</option>
          </select>
          <div style={{ position: 'absolute', right: '10px', pointerEvents: 'none', fontSize: '0.7em' }}>▼</div>
        </div>

        <button onClick={onLogout} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#e74c3c' }} title={t('LogOut')}>
          <LogOut size={20} />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
