const User = require('../models/User');
const Profile = require('../models/Profile');
const FoodLog = require('../models/FoodLog');
const WaterIntake = require('../models/WaterIntake');
const Streak = require('../models/Streak');
const ThemePreference = require('../models/ThemePreference');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Middleware to authenticate JWT (Shared logic)
const authenticate = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token.split(' ')[1], JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Unauthorized' });
    req.userId = decoded.id;
    next();
  });
};

const JWT_SECRET = 'your-very-secret-key-change-it'; // In production, use env variables

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({ email, password: hashedPassword, name });

    // Create empty profile
    await Profile.create({ userId: user.id });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete Account
router.delete('/account', authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    // Delete all associated data
    await Profile.destroy({ where: { userId } });
    await FoodLog.destroy({ where: { userId } });
    await WaterIntake.destroy({ where: { userId } });
    await Streak.destroy({ where: { userId } });
    await ThemePreference.destroy({ where: { userId } });

    // Finally delete the user
    await User.destroy({ where: { id: userId } });

    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = { router, JWT_SECRET, authenticate };
