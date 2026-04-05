import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import ProfileSetup from './components/ProfileSetup';
import Chatbot from './components/Chatbot';
import Navbar from './components/Navbar';
import BMICalculator from './components/BMICalculator';
import NutritionUpload from './components/NutritionUpload';
import InteractiveBackground from './components/InteractiveBackground';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

  const handleLogin = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    if (localStorage.getItem('darkMode') === 'true') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    
    // Inject custom Primary theme early via CSS root properties
    const customTheme = localStorage.getItem('themeColor');
    if (customTheme) {
      document.documentElement.style.setProperty('--primary', customTheme);
    }

    // Restore background color
    const savedBg = localStorage.getItem('bgColor');
    if (savedBg) {
      document.documentElement.style.setProperty('--bg-base', savedBg);
      document.documentElement.style.setProperty('--background', savedBg);
    }
  }, []);

  useEffect(() => {
    if (token) {
      // Meal check loop - checks periodically ensuring it only triggers once per designated hour
      let lastMealAlertHour = -1;
      const mealTimer = setInterval(() => {
        const hour = new Date().getHours();
        if (hour !== lastMealAlertHour) {
          if (hour === 8) { alert("Nutri AI: Time for a healthy breakfast! 🥣"); lastMealAlertHour = hour; }
          if (hour === 13) { alert("Nutri AI: Time for your balanced lunch! 🥗"); lastMealAlertHour = hour; }
          if (hour === 20) { alert("Nutri AI: Time for a light dinner! 🍲"); lastMealAlertHour = hour; }
        }
      }, 60000); // Check every minute

      // Dedicated elapsed 1-hour water tracker
      const waterTimer = setInterval(() => {
        alert("Nutri AI: Hydration check! Drink some water. 💧");
      }, 3600000); // Exactly every 60 minutes based on session

      return () => {
        clearInterval(mealTimer);
        clearInterval(waterTimer);
      };
    }
  }, [token]);

  return (
    <Router>
      <InteractiveBackground />
      {token && <Navbar user={user} onLogout={handleLogout} />}
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <Routes>
          <Route path="/auth" element={!token ? <Auth onLogin={handleLogin} /> : <Navigate to="/" />} />
          <Route path="/" element={token ? <Dashboard /> : <Navigate to="/auth" />} />
          <Route path="/profile" element={token ? <ProfileSetup onLogout={handleLogout} /> : <Navigate to="/auth" />} />
          <Route path="/chat" element={token ? <Chatbot /> : <Navigate to="/auth" />} />
          <Route path="/bmi" element={<BMICalculator />} />
          <Route path="/nutrition" element={token ? <NutritionUpload /> : <Navigate to="/auth" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
