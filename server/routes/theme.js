const express = require('express');
const ThemePreference = require('../models/ThemePreference');
const { authenticate } = require('./profile');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const [themeConfig] = await ThemePreference.findOrCreate({
      where: { userId: req.userId },
      defaults: { primaryColor: '#2ecc71' }
    });
    res.json(themeConfig);
  } catch (err) {
    console.error('Error fetching theme configuration:', err);
    res.status(500).json({ message: 'Server error retrieving theme' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { primaryColor } = req.body;
    if (!primaryColor) return res.status(400).json({ message: 'Primary hex color is required' });

    let [themeConfig] = await ThemePreference.findOrCreate({
      where: { userId: req.userId },
      defaults: { primaryColor: '#2ecc71' }
    });

    themeConfig.primaryColor = primaryColor;
    await themeConfig.save();

    res.json(themeConfig);
  } catch (err) {
    console.error('Error saving theme configuration:', err);
    res.status(500).json({ message: 'Server error saving theme' });
  }
});

module.exports = router;
