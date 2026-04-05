const express = require('express');
const { Op } = require('sequelize');
const FoodLog = require('../models/FoodLog');
const FoodNutrition = require('../models/FoodNutrition');
const { authenticate } = require('./profile');

const router = express.Router();

// Get today's food logs
router.get('/', authenticate, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    let logs = await FoodLog.findAll({
      where: { userId: req.userId, date: today },
      order: [['createdAt', 'ASC']]
    });

    res.json({ logs });
  } catch (err) {
    console.error('Error fetching food logs:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

const CALORIE_DICTIONARY = [
  { keywords: ['idly', 'idli'], calories: 60 },
  { keywords: ['chappathi', 'chapati', 'roti', 'phulka', 'chappati', 'chapatti', 'paratha'], calories: 100 },
  { keywords: ['dal curry', 'lentil curry', 'dal', 'sambar'], calories: 150 },
  { keywords: ['coconut chutney', 'chutney'], calories: 100 },
  { keywords: ['chicken biryani', 'mutton biryani', 'veg biryani', 'biryani'], calories: 400 },
  { keywords: ['white rice', 'brown rice', 'rice'], calories: 130 },
  { keywords: ['boiled egg', 'egg', 'eggs', 'omelette'], calories: 70 },
  { keywords: ['masala dosa', 'dosa'], calories: 150 },
  { keywords: ['apple', 'apples'], calories: 95 },
  { keywords: ['banana', 'bananas'], calories: 105 },
  { keywords: ['orange', 'oranges'], calories: 60 },
  { keywords: ['papaya', 'papayas'], calories: 120 },
  { keywords: ['mango', 'mangoes'], calories: 150 },
  { keywords: ['chicken breast', 'chicken curry', 'chicken'], calories: 250 },
  { keywords: ['paneer butter masala', 'paneer'], calories: 300 },
  { keywords: ['pizza'], calories: 285 },
  { keywords: ['burger'], calories: 250 },
  { keywords: ['sandwich'], calories: 200 },
  { keywords: ['salad'], calories: 100 },
  { keywords: ['milk'], calories: 120 },
  { keywords: ['tea'], calories: 50 },
  { keywords: ['coffee'], calories: 10 },
  { keywords: ['oatmeal', 'oats'], calories: 150 }
];

function estimateCalories(input) {
  let total = 0;
  let matchedAny = false;
  let searchSpace = input.toLowerCase();

  for (const item of CALORIE_DICTIONARY) {
    for (const kw of item.keywords) {
      const regex = new RegExp(`(?:(\\d+(?:\\.\\d+)?)\\s*)?${kw}(?:\\s*(\\d+(?:\\.\\d+)?))?`);
      const match = searchSpace.match(regex);
      if (match) {
        const qtyStr = match[1] || match[2];
        const qty = qtyStr ? parseFloat(qtyStr) : 1;
        total += item.calories * qty;
        matchedAny = true;
        searchSpace = searchSpace.replace(regex, ''); 
        break; 
      }
    }
  }
  return { total, matchedAny };
}

// Add a new food log
router.post('/', authenticate, async (req, res) => {
  try {
    const { foodName } = req.body;
    if (!foodName) return res.status(400).json({ message: 'Food name is required' });

    const today = new Date().toISOString().split('T')[0];

    // Evaluate against the heuristic parsing engine first
    const heuristic = estimateCalories(foodName);
    let assignedCalories = heuristic.total;

    // If completely unmatched, fallback to DB like query or baseline
    if (!heuristic.matchedAny) {
      const nutritionInfo = await FoodNutrition.findOne({
        where: { name: { [Op.like]: `%${foodName}%` } }
      });
      assignedCalories = nutritionInfo ? nutritionInfo.calories : 100;
    }

    const newLog = await FoodLog.create({
      userId: req.userId,
      date: today,
      foodName: foodName,
      calories: assignedCalories
    });

    res.status(201).json(newLog);
  } catch (err) {
    console.error('Error adding food log:', err);
    res.status(500).json({ message: 'Server error adding food log' });
  }
});

// Delete a food log
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const count = await FoodLog.destroy({
      where: { id: id, userId: req.userId }
    });

    if (count === 0) {
      return res.status(404).json({ message: 'Log not found or unauthorized' });
    }

    res.json({ message: 'Food log deleted successfully' });
  } catch (err) {
    console.error('Error deleting food log:', err);
    res.status(500).json({ message: 'Server error deleting log' });
  }
});

module.exports = router;
