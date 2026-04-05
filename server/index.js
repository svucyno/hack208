const express = require('express');
const cors = require('cors');
const sequelize = require('./db');
const { router: authRouter } = require('./routes/auth');
const { router: profileRouter } = require('./routes/profile');
const dietRouter = require('./routes/diet');
const nutritionRouter = require('./routes/nutrition');
const waterRouter = require('./routes/water');
const foodlogRouter = require('./routes/foodlog');
const streakRouter = require('./routes/streak');
const themeRouter = require('./routes/theme');
const User = require('./models/User');
const Profile = require('./models/Profile');
const FoodNutrition = require('./models/FoodNutrition');
const WaterIntake = require('./models/WaterIntake');
const FoodLog = require('./models/FoodLog');
const Streak = require('./models/Streak');
const ThemePreference = require('./models/ThemePreference');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Log incoming requests
app.use((req, res, next) => {
  console.log('Incoming Request:', req.method, req.url);
  if ((req.method === 'PUT' || req.method === 'POST') && req.body && typeof req.body === 'object') {
    console.log('Body keys:', Object.keys(req.body));
  }
  next();
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/diet', dietRouter);
app.use('/api/nutrition', nutritionRouter);
app.use('/api/water', waterRouter);
app.use('/api/foodlog', foodlogRouter);
app.use('/api/streak', streakRouter);
app.use('/api/theme', themeRouter);


// Sync Database and Start Server
sequelize.sync().then(() => {
  console.log('Database synced');
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to sync database:', err);
});


