const express = require('express');
const { authenticate } = require('./profile');
const Profile = require('../models/Profile');
const { generateDietPlan, calculateBMI } = require('../logic/dietEngine');
const router = express.Router();

// Get Diet Plan
router.get('/plan', authenticate, async (req, res) => {
  try {
    const profile = await Profile.findOne({ where: { userId: req.userId } });
    if (!profile || !profile.weight || !profile.height) {
      return res.status(400).json({ message: 'Please complete your profile first.' });
    }
    const dietPlan = await generateDietPlan(profile);
    res.json(dietPlan);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get BMI
router.get('/bmi', authenticate, async (req, res) => {
  try {
    const profile = await Profile.findOne({ where: { userId: req.userId } });
    if (!profile || !profile.weight || !profile.height) {
      return res.status(400).json({ message: 'Please provide weight and height.' });
    }
    const bmiData = calculateBMI(profile.weight, profile.height);
    res.json(bmiData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
