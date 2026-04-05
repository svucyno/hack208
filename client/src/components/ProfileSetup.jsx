import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { Camera, Trash2, User, Palette, Layers } from 'lucide-react';
import ThemeSettings from './ThemeSettings';
import { useLanguage } from '../context/LanguageContext';

const ProfileSetup = ({ onLogout }) => {
  const { t } = useLanguage();
  const [profile, setProfile] = useState({
    age: '', weight: '', height: '', gender: 'male',
    goal: 'maintenance', dietaryPreference: 'veg', allergies: '', avatar: null
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/profile');
        if (res.data) setProfile(res.data);
      } catch (err) {
        // no existing profile yet
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put('/profile', profile);
      alert('Profile updated successfully!');
      navigate('/');
    } catch (err) {
      alert('Failed to update profile');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm(t('Are you sure you want to delete your account? This action cannot be undone.'))) {
      try {
        await api.delete('/auth/account');
        onLogout();
        navigate('/auth');
      } catch (err) {
        alert(t('Failed to delete account'));
      }
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      alert('Only JPG and PNG files are allowed.');
      e.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('File is too large. Maximum size is 2 MB.');
      e.target.value = '';
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfile(prev => ({ ...prev, avatar: reader.result }));
      setUploading(false);
    };
    reader.onerror = () => {
      alert('Failed to read image. Please try again.');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    setProfile(prev => ({ ...prev, avatar: null }));
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>{t('Loading profile…')}</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1rem' }}>
      <div className="card" style={{ maxWidth: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ color: 'var(--primary)', margin: 0 }}>
            {t('Your Profile')}
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
               type="button"
               onClick={() => setActivePanel(prev => prev === 'accent' ? null : 'accent')}
               style={{
                 background: activePanel === 'accent' ? 'var(--primary)' : 'transparent',
                 color: activePanel === 'accent' ? '#fff' : 'var(--text-main)',
                 border: '1px solid var(--primary)',
                 padding: '0.4rem 0.8rem',
                 borderRadius: '20px',
                 cursor: 'pointer',
                 display: 'flex', gap: '0.4rem', alignItems: 'center',
                 fontSize: '0.85rem', fontWeight: '500',
                 transition: 'all 0.2s'
               }}>
               <Palette size={16} /> {t('Accent Color')}
            </button>
            <button 
               type="button"
               onClick={() => setActivePanel(prev => prev === 'background' ? null : 'background')}
               style={{
                 background: activePanel === 'background' ? 'var(--primary)' : 'transparent',
                 color: activePanel === 'background' ? '#fff' : 'var(--text-main)',
                 border: '1px solid var(--primary)',
                 padding: '0.4rem 0.8rem',
                 borderRadius: '20px',
                 cursor: 'pointer',
                 display: 'flex', gap: '0.4rem', alignItems: 'center',
                 fontSize: '0.85rem', fontWeight: '500',
                 transition: 'all 0.2s'
               }}>
               <Layers size={16} /> {t('Background Color')}
            </button>
          </div>
        </div>

        {/* ── Avatar Section ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <div className={`avatar-circle${uploading ? ' uploading' : ''}`}>
            {profile.avatar ? (
              <img src={profile.avatar} alt="Profile Avatar" />
            ) : (
              <User size={60} color="var(--text-muted, #bdc3c7)" />
            )}
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <label className="avatar-upload-btn" title={t("Upload a JPG or PNG (max 2 MB)")}>
              <Camera size={15} />
              {profile.avatar ? t('Change Photo') : t('Upload Photo')}
              <input
                type="file"
                accept="image/jpeg,image/png"
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />
            </label>

            {profile.avatar && (
              <button
                type="button"
                className="avatar-remove-btn"
                onClick={removeAvatar}
                title={t("Remove photo")}
              >
                <Trash2 size={15} /> {t('Remove')}
              </button>
            )}
          </div>

          {uploading && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {t('Processing image…')}
            </p>
          )}
        </div>

        {/* ── Profile Form ── */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label>{t('Age')}</label>
              <input
                type="number"
                value={profile.age ?? ''}
                onChange={e => setProfile({ ...profile, age: e.target.value })}
                required
              />
            </div>
            <div className="input-group">
              <label>{t('Gender')}</label>
              <select value={profile.gender} onChange={e => setProfile({ ...profile, gender: e.target.value })}>
                <option value="male">{t('Male')}</option>
                <option value="female">{t('Female')}</option>
                <option value="other">{t('Other')}</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label>{t('Weight (kg)')}</label>
              <input
                type="number" step="0.1"
                value={profile.weight ?? ''}
                onChange={e => setProfile({ ...profile, weight: e.target.value })}
                required
              />
            </div>
            <div className="input-group">
              <label>{t('Height (cm)')}</label>
              <input
                type="number" step="0.1"
                value={profile.height ?? ''}
                onChange={e => setProfile({ ...profile, height: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>{t('Health Goal')}</label>
            <select value={profile.goal} onChange={e => setProfile({ ...profile, goal: e.target.value })}>
              <option value="weight_loss">{t('Weight Loss')}</option>
              <option value="weight_gain">{t('Weight Gain')}</option>
              <option value="maintenance">{t('Maintenance')}</option>
            </select>
          </div>

          <div className="input-group">
            <label>{t('Dietary Preference')}</label>
            <select value={profile.dietaryPreference} onChange={e => setProfile({ ...profile, dietaryPreference: e.target.value })}>
              <option value="veg">{t('Vegetarian')}</option>
              <option value="non-veg">{t('Non-Vegetarian')}</option>
              <option value="vegan">{t('Vegan')}</option>
            </select>
          </div>

          <div className="input-group">
            <label>{t('Allergies (comma separated)')}</label>
            <input
              type="text"
              placeholder={t("e.g. peanuts, dairy")}
              value={profile.allergies ?? ''}
              onChange={e => setProfile({ ...profile, allergies: e.target.value })}
            />
          </div>

          <button type="submit" className="btn btn-primary">{t('Save Profile')}</button>
          
          <div style={{ marginTop: '2rem', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
            <button
              type="button"
              onClick={handleDeleteAccount}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'transparent',
                color: 'var(--danger)',
                border: '1px solid var(--danger)',
                borderRadius: 'var(--radius)',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(231, 76, 60, 0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <Trash2 size={18} /> {t('Delete Account')}
            </button>
          </div>
        </form>
      </div>

      <ThemeSettings activePanel={activePanel} />
    </div>
  );
};

export default ProfileSetup;
