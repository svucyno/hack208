const express = require('express');
const WaterIntake = require('../models/WaterIntake');
const { authenticate } = require('./profile');
const router = express.Router();

// Get today's water intake
router.get('/', authenticate, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Find or create today's record for this user
    const [waterRecord] = await WaterIntake.findOrCreate({
      where: { userId: req.userId, date: today },
      defaults: { amount: 0 }
    });

    res.json(waterRecord);
  } catch (err) {
    console.error('Error fetching water intake:', err);
    res.status(500).json({ message: 'Failed to fetch water intake', error: err.message });
  }
});

// Update today's water intake
router.post('/', authenticate, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { amountToAdd } = req.body;

    if (amountToAdd === undefined || isNaN(amountToAdd)) {
      return res.status(400).json({ message: 'amountToAdd is required and must be a number' });
    }

    // Find the record for today, and increment it
    const [waterRecord] = await WaterIntake.findOrCreate({
      where: { userId: req.userId, date: today },
      defaults: { amount: 0 }
    });

    waterRecord.amount += parseInt(amountToAdd, 10);
    await waterRecord.save();

    res.json(waterRecord);
  } catch (err) {
    console.error('Error updating water intake:', err);
    res.status(500).json({ message: 'Failed to update water intake', error: err.message });
  }
});

// Reset today's water intake
router.post('/reset', authenticate, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const waterRecord = await WaterIntake.findOne({
      where: { userId: req.userId, date: today }
    });

    if (waterRecord) {
      waterRecord.amount = 0;
      await waterRecord.save();
      res.json(waterRecord);
    } else {
      res.json({ amount: 0 });
    }
  } catch (err) {
    console.error('Error resetting water intake:', err);
    res.status(500).json({ message: 'Failed to reset water', error: err.message });
  }
});

module.exports = router;

