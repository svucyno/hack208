const express = require('express');
const jwt = require('jsonwebtoken');
const Profile = require('../models/Profile');
const { JWT_SECRET } = require('./auth');
const router = express.Router();

// Middleware to authenticate JWT
const authenticate = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token.split(' ')[1], JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Unauthorized' });
    req.userId = decoded.id;
    next();
  });
};

// Get Profile
router.get('/', authenticate, async (req, res) => {
  try {
    const profile = await Profile.findOne({ where: { userId: req.userId } });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update Profile
router.put('/', authenticate, async (req, res) => {
  try {
    const { age, weight, height, gender, goal, dietaryPreference, allergies, avatar } = req.body;
    
    // Sanitize numeric fields - handle empty strings, undefined, null
    const parseNum = (val, parser) => {
      if (val === undefined || val === null || val === '') return null;
      const parsed = parser(val);
      return isNaN(parsed) ? null : parsed;
    };

    const sanitizedAge = parseNum(age, parseInt);
    const sanitizedWeight = parseNum(weight, parseFloat);
    const sanitizedHeight = parseNum(height, parseFloat);

    let profile = await Profile.findOne({ where: { userId: req.userId } });


    const profileData = { 
      userId: req.userId, 
      age: sanitizedAge, 
      weight: sanitizedWeight, 
      height: sanitizedHeight, 
      gender, 
      goal, 
      dietaryPreference, 
      allergies,
      avatar
    };

    if (!profile) {
      profile = await Profile.create(profileData);
    } else {
      await profile.update(profileData);
    }

    res.json(profile);
  } catch (err) {
    console.error('Profile Update Error:', err);
    res.status(500).json({ message: err.message });
  }

});

module.exports = { router, authenticate };
