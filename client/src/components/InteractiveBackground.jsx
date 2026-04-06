import React, { useEffect, useState } from 'react';

const InteractiveBackground = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [bgColor, setBgColor] = useState(
    () => localStorage.getItem('bgColor') || '#f4f7f6'
  );

  useEffect(() => {
    let animationFrameId;

    const handleMouseMove = (e) => {
      animationFrameId = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth) - 0.5;
        const y = (e.clientY / window.innerHeight) - 0.5;
        setMousePos({ x, y });
      });
    };

    // Listen for background color changes dispatched by ThemeSettings
    const handleBgChange = (e) => {
      setBgColor(e.detail);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('bgColorChange', handleBgChange);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('bgColorChange', handleBgChange);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      className="interactive-bg-container"
      style={{ background: 'var(--background)' }}
    >
      {/* Dual radial gradient tint that follows the primary + secondary colors */}
      <div
        className="bg-gradient-layer"
        style={{
          transform: `translate(${mousePos.x * -20}px, ${mousePos.y * -20}px)`
        }}
      />

      {/* Floating emoji + bubble layer with stronger parallax */}
      <div
        className="bg-floating-elements"
        style={{
          transform: `translate(${mousePos.x * -40}px, ${mousePos.y * -40}px)`
        }}
      >
        <span className="float-icon i1">🍎</span>
        <span className="float-icon i2">🥦</span>
        <span className="float-icon i3">💧</span>
        <span className="float-icon i4">🥗</span>
        <span className="float-icon i5">🥑</span>
        <span className="float-icon i6">🍋</span>

        <span className="bg-bubble b1" />
        <span className="bg-bubble b2" />
        <span className="bg-bubble b3" />
        <span className="bg-bubble b4" />
        <span className="bg-bubble b5" />
        <span className="bg-bubble b6" />
      </div>
    </div>
  );
};

export default InteractiveBackground;
