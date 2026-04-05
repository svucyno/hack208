const express = require('express');
const Streak = require('../models/Streak');
const { authenticate } = require('./profile');

const router = express.Router();

router.post('/update', authenticate, async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Attempt to locate an existing streak marker for this user
    let streakRecord = await Streak.findOne({ where: { userId: req.userId } });

    if (!streakRecord) {
      // Create first streak ever for new user
      streakRecord = await Streak.create({
        userId: req.userId,
        count: 1,
        lastActiveDate: todayStr
      });
      return res.json({ count: streakRecord.count, message: '🔥 You started a new streak today!' });
    }

    // Measure the difference in calendar days intelligently
    const today = new Date(todayStr);
    const lastActive = new Date(streakRecord.lastActiveDate);

    const diffTime = Math.abs(today - lastActive);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    let message = '';

    if (diffDays === 0) {
      // User was already active today
      return res.json({ count: streakRecord.count, message: `🔥 You're on a ${streakRecord.count}-day streak!` });
    } else if (diffDays === 1) {
      // User was active precisely yesterday! Increment streak.
      streakRecord.count += 1;
      streakRecord.lastActiveDate = todayStr;
      await streakRecord.save();
      message = `🔥 Great! You reached a ${streakRecord.count}-day streak!`;
    } else {
      // User missed at least 1 day. Reset streak sequence to 1.
      streakRecord.count = 1;
      streakRecord.lastActiveDate = todayStr;
      await streakRecord.save();
      message = '🔥 You started a new streak today!';
    }

    res.json({ count: streakRecord.count, message });

  } catch (err) {
    console.error('Error maintaining streak record:', err);
    res.status(500).json({ message: 'Server error tracking streak' });
  }
});

module.exports = router;
