import React, { useState } from 'react';
import api from '../api';
import { useLanguage } from '../context/LanguageContext';

const Auth = ({ onLogin }) => {
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const res = await api.post(endpoint, formData);
      onLogin(res.data.token, res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="auth-container">
      <div className="card">
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--primary)' }}>
          {isLogin ? t('Welcome Back!') : t('Join Nutri AI')}
        </h2>
        {error && <p style={{ color: '#e74c3c', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="input-group">
              <label>{t('Full Name')}</label>
              <input type="text" placeholder="John Doe" onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
          )}
          <div className="input-group">
            <label>{t('Email Address')}</label>
            <input type="email" placeholder="email@example.com" onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
          </div>
          <div className="input-group">
            <label>{t('Password')}</label>
            <input type="password" placeholder="••••••••" onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
          </div>
          <button type="submit" className="btn btn-primary">{isLogin ? t('Login') : t('Sign Up')}</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem' }}>
          {isLogin ? t("Don't have an account? ") : t("Already have an account? ")}
          <span style={{ color: '#3498db', cursor: 'pointer' }} onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? t('Register') : t('Login')}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Auth;
