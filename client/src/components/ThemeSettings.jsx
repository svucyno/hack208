import React, { useState, useEffect } from 'react';
import api from '../api';
import { Palette, Check, Layers } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// ── Background color presets ────────────────────────────────────────────────
const BG_PRESETS = [
  { name: 'Mint Mist (Default)', hex: '#f4f7f6' },
  { name: 'Sky Blue',            hex: '#eaf4fb' },
  { name: 'Lavender Blush',      hex: '#f5f0ff' },
  { name: 'Peach Cream',         hex: '#fff5ee' },
  { name: 'Sage Green',          hex: '#edf7f0' },
  { name: 'Warm Sand',           hex: '#fdf8ee' },
  { name: 'Slate Grey',          hex: '#f0f2f5' },
  { name: 'Deep Navy',           hex: '#1a1d2e' },
  { name: 'Dark Charcoal',       hex: '#121212' },
];

// ── Primary color presets ───────────────────────────────────────────────────
const PRIMARY_PRESETS = [
  { name: 'Emerald (Default)', hex: '#2ecc71' },
  { name: 'Ocean Blue',        hex: '#3498db' },
  { name: 'Purple',            hex: '#9b59b6' },
  { name: 'Sunset Orange',     hex: '#e67e22' },
  { name: 'Rose Red',          hex: '#e74c3c' },
  { name: 'Turquoise',         hex: '#1abc9c' },
];

// ── Helper — apply bg color globally ────────────────────────────────────────
function applyBgColor(hex) {
  document.documentElement.style.setProperty('--bg-base', hex);
  localStorage.setItem('bgColor', hex);

  // Notify InteractiveBackground without a full remount
  window.dispatchEvent(new CustomEvent('bgColorChange', { detail: hex }));

  // Auto-enable dark mode for dark backgrounds
  const isDark = isColorDark(hex);
  if (isDark) {
    document.body.classList.add('dark-mode');
    localStorage.setItem('darkMode', 'true');
  } else {
    document.body.classList.remove('dark-mode');
    localStorage.setItem('darkMode', 'false');
  }
}

function isColorDark(hex) {
  const c = hex.replace('#', '');
  if (c.length < 6) return false;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  // Perceived luminance
  return (0.299 * r + 0.587 * g + 0.114 * b) < 128;
}

// ── Component ────────────────────────────────────────────────────────────────
const ThemeSettings = ({ activePanel }) => {
  const { t } = useLanguage();
  const [selectedColor, setSelectedColor] = useState(
    localStorage.getItem('themeColor') || '#2ecc71'
  );
  const [selectedBg, setSelectedBg] = useState(
    localStorage.getItem('bgColor') || '#f4f7f6'
  );

  useEffect(() => {
    // Restore saved background on mount
    const savedBg = localStorage.getItem('bgColor');
    if (savedBg) applyBgColor(savedBg);

    // Restore saved primary color
    api.get('/theme').then(res => {
      if (res.data?.primaryColor) {
        setPrimary(res.data.primaryColor, false);
      }
    }).catch(() => {});
  }, []);

  // ── Primary color ─────────────────────────────────────────────────────────
  const setPrimary = async (hex, saveToDb = true) => {
    setSelectedColor(hex);
    document.documentElement.style.setProperty('--primary', hex);
    // Derive a darker shade for hover states
    document.documentElement.style.setProperty('--primary-dark', darken(hex, 15));
    localStorage.setItem('themeColor', hex);

    if (saveToDb) {
      try { await api.post('/theme', { primaryColor: hex }); }
      catch {}
    }
  };

  // ── Background color ──────────────────────────────────────────────────────
  const handleBgChange = (hex) => {
    setSelectedBg(hex);
    applyBgColor(hex);
  };

  if (!activePanel) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem', animation: 'fadeIn 0.3s ease' }}>

      {/* ── Primary Color Card ────────────────────────────────────────────── */}
      {activePanel === 'accent' && (
      <div className="card" style={{ padding: '1.75rem' }}>
        <h3 style={{
          borderBottom: '1px solid #eee', paddingBottom: '1rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem'
        }}>
          <Palette size={20} color="var(--primary)" /> {t('Accent Color')}
        </h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
          {t('Customise buttons, highlights and interactive elements.')}
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {PRIMARY_PRESETS.map(p => (
            <button
              key={p.hex}
              onClick={() => setPrimary(p.hex)}
              title={p.name}
              style={{
                width: '46px', height: '46px',
                borderRadius: '50%',
                background: p.hex,
                border: selectedColor === p.hex ? '3px solid #fff' : '2px solid transparent',
                boxShadow: selectedColor === p.hex
                  ? `0 0 0 3px ${p.hex}, 0 4px 12px ${p.hex}66`
                  : '0 2px 6px rgba(0,0,0,0.2)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'transform 0.2s, box-shadow 0.2s',
                transform: selectedColor === p.hex ? 'scale(1.15)' : 'scale(1)',
              }}
            >
              {selectedColor === p.hex && <Check size={18} color="#fff" strokeWidth={3} />}
            </button>
          ))}

          {/* Custom picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('Custom:')}</span>
            <div style={{ position: 'relative', width: '46px', height: '46px' }}>
              <input
                type="color"
                value={selectedColor}
                onChange={e => setPrimary(e.target.value)}
                style={{
                  width: '46px', height: '46px',
                  border: '2px solid #ddd', borderRadius: '50%',
                  cursor: 'pointer', padding: '2px',
                  background: 'transparent',
                }}
                title="Pick a custom accent color"
              />
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ── Background Color Card ─────────────────────────────────────────── */}
      {activePanel === 'background' && (
      <div className="card" style={{ padding: '1.75rem' }}>
        <h3 style={{
          borderBottom: '1px solid #eee', paddingBottom: '1rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem'
        }}>
          <Layers size={20} color="var(--primary)" /> {t('Background Color')}
        </h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
          {t('Choose the canvas color for your entire interface. Dark presets auto-enable dark mode.')}
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {BG_PRESETS.map(p => (
            <button
              key={p.hex}
              onClick={() => handleBgChange(p.hex)}
              title={p.name}
              style={{
                width: '46px', height: '46px',
                borderRadius: '12px',
                background: p.hex,
                border: selectedBg === p.hex
                  ? '3px solid var(--primary)'
                  : '2px solid #ccc',
                boxShadow: selectedBg === p.hex
                  ? `0 0 0 2px var(--primary), 0 4px 12px rgba(0,0,0,0.15)`
                  : '0 2px 6px rgba(0,0,0,0.12)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'transform 0.2s, box-shadow 0.2s',
                transform: selectedBg === p.hex ? 'scale(1.12)' : 'scale(1)',
                position: 'relative',
              }}
            >
              {selectedBg === p.hex && (
                <Check
                  size={16}
                  color={isColorDark(p.hex) ? '#fff' : '#333'}
                  strokeWidth={3}
                />
              )}
            </button>
          ))}

          {/* Custom picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('Custom:')}</span>
            <input
              type="color"
              value={selectedBg}
              onChange={e => handleBgChange(e.target.value)}
              style={{
                width: '46px', height: '46px',
                border: '2px solid #ddd', borderRadius: '8px',
                cursor: 'pointer', padding: '2px',
                background: 'transparent',
              }}
              title="Pick a custom background color"
            />
          </div>
        </div>

        {/* Preview swatch + helper text */}
        <div style={{
          marginTop: '1.25rem', padding: '0.75rem 1rem',
          borderRadius: '10px', background: selectedBg,
          border: '1px solid rgba(0,0,0,0.08)',
          display: 'flex', alignItems: 'center', gap: '0.75rem'
        }}>
          <span style={{ fontSize: '1.2rem' }}>🎨</span>
          <span style={{
            fontSize: '0.85rem',
            color: isColorDark(selectedBg) ? 'rgba(255,255,255,0.8)' : '#555'
          }}>
            {t('Preview — your background is currently')} <strong>{selectedBg}</strong>
          </span>
        </div>
      </div>
      )}

    </div>
  );
};

// ── Utility: darken a hex color by `amount` luminance pts ──────────────────
function darken(hex, amount = 15) {
  const c = hex.replace('#', '');
  if (c.length !== 6) return hex;
  const r = Math.max(0, parseInt(c.slice(0,2),16) - amount);
  const g = Math.max(0, parseInt(c.slice(2,4),16) - amount);
  const b = Math.max(0, parseInt(c.slice(4,6),16) - amount);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

export default ThemeSettings;
