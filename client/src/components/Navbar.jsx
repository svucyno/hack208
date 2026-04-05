import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Apple, LayoutDashboard, User, MessageSquare, LogOut, Activity, Upload, Globe, Settings as SettingsIcon } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav style={{
      background: 'var(--card-bg)',
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: 'var(--shadow)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      transition: 'background-color 0.3s ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--primary)' }}>
        <Apple /> {t('Nutri AI')}
      </div>
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <Link to="/" className="nav-link"><LayoutDashboard size={20} title={t('Dashboard')} /></Link>
        <Link to="/chat" className="nav-link"><MessageSquare size={20} title={t('Chatbot')} /></Link>
        <Link to="/bmi" className="nav-link"><Activity size={20} title={t('BMI Calculator')} /></Link>
        <Link to="/nutrition" className="nav-link"><Upload size={20} title={t('Upload Data')} /></Link>
        
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Globe size={16} color="var(--primary)" style={{ position: 'absolute', left: '10px', pointerEvents: 'none' }} />
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{ 
              border: '1px solid var(--text-muted)', background: 'transparent', cursor: 'pointer',
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

        <div style={{ position: 'relative' }} ref={settingsRef}>
          <button 
            onClick={() => setSettingsOpen(!settingsOpen)}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-main)', display: 'flex', alignItems: 'center' }}
            title={t('Settings')}
          >
            <SettingsIcon size={20} style={{ transition: 'transform 0.3s ease', transform: settingsOpen ? 'rotate(45deg)' : 'rotate(0)' }} />
          </button>
          
          {settingsOpen && (
            <div style={{
              position: 'absolute', top: '150%', right: 0,
              background: 'var(--card-bg)', boxShadow: 'var(--shadow)',
              borderRadius: '10px', padding: '0.5rem', minWidth: '150px',
              border: '1px solid var(--text-muted)', animation: 'fadeIn 0.2s ease',
              zIndex: 1000
            }}>
              <Link 
                to="/profile" 
                onClick={() => setSettingsOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.5rem 1rem', textDecoration: 'none', color: 'var(--text-main)',
                  borderRadius: '6px', transition: 'all 0.2s ease'
                }}
                className="settings-link"
                onMouseEnter={e => { 
                  e.currentTarget.style.background = 'var(--primary)'; 
                  e.currentTarget.style.color = '#fff'; 
                }}
                onMouseLeave={e => { 
                  e.currentTarget.style.background = 'transparent'; 
                  e.currentTarget.style.color = 'var(--text-main)'; 
                }}
              >
                <User size={16} /> {t('Your Profile')}
              </Link>
            </div>
          )}
        </div>

        <button onClick={onLogout} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#e74c3c' }} title={t('LogOut')}>
          <LogOut size={20} />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
