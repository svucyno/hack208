import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Apple, Activity, Info, Mic, MicOff, Flame } from 'lucide-react';
import api from '../api';
import { useLanguage } from '../context/LanguageContext';

// ── Intent helpers ───────────────────────────────────────────────────────────
const CALORIE_PATTERNS = [
  /^calories?\s+in\s+(.+)$/i,
  /^how\s+many\s+calories?\s+(?:are\s+)?in\s+(.+)$/i,
  /^how\s+many\s+calories?\s+(?:does\s+)?(.+)\s+have\??$/i,
  /^calorie\s+count\s+(?:of|for)\s+(.+)$/i,
  /^nutrition\s+(?:of|for|in)\s+(.+)$/i,
  /^check\s+calories?\s+(?:of|for|in)?\s*(.+)$/i,
  /^what(?:'s|\s+is)\s+the\s+calorie(?:s)?\s+(?:in|of|for)\s+(.+)$/i,
];

function extractCalorieQuery(text) {
  for (const pattern of CALORIE_PATTERNS) {
    const m = text.trim().match(pattern);
    if (m) return m[1].trim();
  }
  return null;
}

// ── Response builder ─────────────────────────────────────────────────────────
function buildCalorieResponse(data, rawQuery) {
  const name = data.food ? data.food.charAt(0).toUpperCase() + data.food.slice(1) : rawQuery;
  const qty  = data.quantity > 1 ? `${data.quantity} serving(s) of ` : '';
  let msg = `🔥 ${qty}**${name}** contains approximately **${data.calories} kcal**.`;
  msg += `\n📏 Serving reference: ${data.serving}`;
  if (data.protein) msg += `\n🥩 Protein: ${data.protein}g  |  🍞 Carbs: ${data.carbs}g  |  🫒 Fats: ${data.fats}g`;
  msg += `\n${data.tag}`;
  return msg;
}

// ── Main Component ────────────────────────────────────────────────────────────
const Chatbot = () => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState([
    { id: 1, text: t("Hi! I'm your Nutri AI assistant. How can I help you today?\n\nTry asking:\n• \"Calories in 2 eggs\"\n• \"How many calories in chicken curry\"\n• \"Check calories of banana\""), sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [userAvatar, setUserAvatar] = useState(null);
  // calorie mode: null | 'awaiting_food'
  const [calorieMode, setCalorieMode] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  // Load user avatar
  useEffect(() => {
    api.get('/profile')
      .then(res => { if (res.data?.avatar) setUserAvatar(res.data.avatar); })
      .catch(() => {});
  }, []);

  const pushBot = (text) => {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), text, sender: 'bot' }]);
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert('Voice input not supported in this browser'); return; }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev ? `${prev} ${transcript}` : transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  // ── Calorie lookup ───────────────────────────────────────────────────────
  const lookupCalories = async (query) => {
    try {
      const res = await api.get(`/nutrition/calories?query=${encodeURIComponent(query)}`);
      return buildCalorieResponse(res.data, query);
    } catch (e) {
      if (e.response?.status === 404) {
        return `😕 I couldn't find calorie data for "${query}". Try a more common food name, or upload your nutrition dataset via the Upload page!`;
      }
      return `⚠️ Trouble fetching calorie data right now. Please try again shortly.`;
    }
  };

  // ── Main send handler ────────────────────────────────────────────────────
  const handleSend = async (text) => {
    if (!text.trim()) return;

    const userMsg = { id: Date.now(), text, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // ── Calorie awaiting mode ────────────────────────────────────────────
    if (calorieMode === 'awaiting_food') {
      setCalorieMode(null);
      setTimeout(async () => {
        pushBot(await lookupCalories(text));
      }, 400);
      return;
    }

    setTimeout(async () => {
      const lowerText = text.toLowerCase();

      // 2. Calorie pattern detection
      const calorieQuery = extractCalorieQuery(text);
      if (calorieQuery) {
        pushBot(await lookupCalories(calorieQuery));
        return;
      }

      // 3. Existing: Diet plan
      if (lowerText.includes('diet') || lowerText.includes('today')) {
        try {
          const res = await api.get('/diet/plan');
          pushBot(`Your diet for today:\n🌅 Breakfast: ${res.data.meals.breakfast.name}\n☀️ Lunch: ${res.data.meals.lunch.name}\n🌙 Dinner: ${res.data.meals.dinner.name}\n\nTotal: ${res.data.totalCalories} kcal.`);
        } catch {
          pushBot('Please complete your profile so I can generate a diet plan for you!');
        }
        return;
      }

      // 4. Existing: BMI
      if (lowerText.includes('bmi')) {
        try {
          const res = await api.get('/diet/bmi');
          pushBot(`Your current BMI is ${res.data.bmi}, which falls in the '${res.data.category}' category.`);
        } catch {
          pushBot('I need your weight and height to calculate BMI. Please update your profile.');
        }
        return;
      }

      // 5. Existing: Tips
      if (lowerText.includes('tip') || lowerText.includes('healthy')) {
        const tips = [
          'Swap sugary drinks for sparkling water with a splash of lime.',
          'Try to fill half your plate with vegetables at every meal.',
          'Use small plates to help with portion control.',
          "Prioritize sleep; it's as important for health as diet and exercise!"
        ];
        pushBot(tips[Math.floor(Math.random() * tips.length)]);
        return;
      }

      // 6. Existing: Water
      if (lowerText.includes('water') || lowerText.includes('drink') || lowerText.includes('drank')) {
        try {
          const res = await api.get('/water');
          const amount = res.data.amount || 0;
          pushBot(`You have logged ${amount} ml of water today. Your daily goal is 2500 ml. Keep hydrating! 💧`);
        } catch {
          pushBot("I couldn't fetch your water intake right now. Please try again later.");
        }
        return;
      }

      // 7. Existing: General nutrition DB search (fallback)
      try {
        const res = await api.get(`/nutrition/search?query=${encodeURIComponent(text)}`);
        const data = res.data;
        let response = `${data.quantity} unit(s) of ${data.name} contains approximately ${data.calories} kcal, ${data.protein}g protein, ${data.carbs}g carbs, and ${data.fats}g fats (Serving: ${data.servingSize}).`;
        if (data.name.includes('fry') || data.name.includes('burger')) {
          response += ' Pro-tip: Try a grilled or steamed version for fewer calories!';
        }
        pushBot(response);
      } catch (e) {
        if (e.response?.status === 404) {
          pushBot("I'm here to help with your nutrition! Ask about today's diet, BMI, calorie counts (e.g. 'calories in rice'), or a specific food.");
        } else {
          pushBot("I'm having trouble right now. Please try again or ask about your BMI/diet plan.");
        }
      }
    }, 400);
  };

  // ── Direct calorie mode trigger (from button) ───────────────────────────
  const triggerCalorieMode = () => {
    setMessages(prev => [...prev, { id: Date.now(), text: `🔥 ${t('Check calories')}`, sender: 'user' }]);
    setCalorieMode('awaiting_food');
    setTimeout(() => {
      pushBot(t('🍽️ Sure! Enter a food item or recipe (e.g. "rice", "2 eggs", "chicken curry"):'));
    }, 300);
  };

  const QuickButton = ({ icon: Icon, label, onClick }) => (
    <button
      onClick={onClick}
      className="chat-quick-btn"
    >
      <Icon size={16} /> {label}
    </button>
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1rem' }}>
      <div className="chat-window">
        {/* Header */}
        <div style={{ padding: '1rem', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bot /> <strong>{t('Nutri AI Assistant')}</strong>
            {calorieMode && (
              <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.2)', padding: '0.15rem 0.5rem', borderRadius: '10px', marginLeft: '0.5rem' }}>
                🔥 {t('Calorie mode')}
              </span>
            )}
          </div>
          {userAvatar && (
            <div className="avatar-circle-sm" style={{ border: '2px solid rgba(255,255,255,0.7)', cursor: 'default' }}>
              <img src={userAvatar} alt="Your avatar" />
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.map(msg => (
            <div key={msg.id} className={`message ${msg.sender}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                {msg.sender === 'bot' ? (
                  <Bot size={14} />
                ) : (
                  userAvatar
                    ? <img src={userAvatar} alt="You" style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }} />
                    : <User size={14} />
                )}
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{msg.sender === 'bot' ? t('NUTRI AI') : t('YOU')}</span>
              </div>
              {/* Render newlines */}
              {msg.text.split('\n').map((line, i) => (
                <span key={i} style={{ display: 'block', lineHeight: '1.6' }}>
                  {line.replace(/\*\*(.+?)\*\*/g, '$1')}
                </span>
              ))}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Buttons */}
        <div className="chat-quick-bar">
          <QuickButton icon={Apple}   label={t("Today's diet")}   onClick={() => handleSend("Show today's diet")} />
          <QuickButton icon={Activity} label={t("My BMI")}        onClick={() => handleSend("What is my BMI?")} />
          <QuickButton icon={Info}    label={t("Healthy tip")}    onClick={() => handleSend("Give me a healthy tip")} />
          <QuickButton icon={Flame}   label={t("Check calories")} onClick={triggerCalorieMode} />
        </div>

        {/* Input */}
        <form className="chat-input" onSubmit={e => { e.preventDefault(); handleSend(input); }}>
          <input
            type="text"
            placeholder={
              calorieMode === 'awaiting_food'
                ? t('Enter food item (e.g. "2 eggs", "chicken curry")…')
                : isListening ? t('Listening… 🎤') : t('Type your message…')
            }
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <button
            type="button"
            onClick={startListening}
            style={{
              background: isListening ? '#e74c3c' : 'transparent',
              border: 'none',
              color: isListening ? 'white' : 'var(--text-muted)',
              padding: '0.5rem', borderRadius: '50%', cursor: 'pointer',
              transition: 'all 0.3s ease',
              flexShrink: 0
            }}
            title="Voice Input"
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          <button type="submit" style={{ background: 'var(--primary)', border: 'none', color: 'white', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer' }}>
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;
