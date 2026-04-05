const FOOD_DATABASE = {
  veg: {
    breakfast: [
      { name: 'Oatmeal with Fruits', calories: 300 },
      { name: 'Paneer Paratha (1 pc)', calories: 280 },
      { name: 'Greek Yogurt with Granola', calories: 350 },
      { name: 'Idli with Sambar', calories: 250 }
    ],
    lunch: [
      { name: 'Dal Tadka with Jeera Rice', calories: 450 },
      { name: 'Paneer Butter Masala with Roti', calories: 550 },
      { name: 'Mix Veg Salad with Quinoa', calories: 400 },
      { name: 'Rajma Chawal', calories: 500 }
    ],
    dinner: [
      { name: 'Mushroom Risotto', calories: 500 },
      { name: 'Palak Paneer with Brown Rice', calories: 480 },
      { name: 'Vegetable Stir-fry with Tofu', calories: 420 },
      { name: 'Lentil Soup with Whole Wheat Bread', calories: 350 }
    ]
  },
  'non-veg': {
    breakfast: [
      { name: 'Scrambled Eggs with Toast', calories: 350 },
      { name: 'Chicken Sausage with Omelette', calories: 400 },
      { name: 'Greek Yogurt with Granola', calories: 350 },
      { name: 'Smoked Salmon Bagel', calories: 450 }
    ],
    lunch: [
      { name: 'Grilled Chicken with Sweet Potato', calories: 500 },
      { name: 'Fish Curry with Steamed Rice', calories: 550 },
      { name: 'Chicken Salad with Avocado', calories: 450 },
      { name: 'Beef Stir-fry with Vegetables', calories: 600 }
    ],
    dinner: [
      { name: 'Baked Salmon with Asparagus', calories: 480 },
      { name: 'Chicken Tikka Masala with Naan', calories: 600 },
      { name: 'Turkey Meatballs with Pasta', calories: 550 },
      { name: 'Grilled Tuna Steak with Salad', calories: 520 }
    ]
  }
};

const calculateBMI = (weight, height) => {
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  let category = '';
  if (bmi < 18.5) category = 'Underweight';
  else if (bmi < 25) category = 'Normal';
  else if (bmi < 30) category = 'Overweight';
  else category = 'Obese';
  return { bmi: bmi.toFixed(2), category };
};

const calculateCalories = (profile) => {
  const { age, weight, height, gender, goal } = profile;
  let bmr;
  if (gender === 'male') {
    bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }

  let tdee = bmr * 1.2; // Sedentary

  if (goal === 'weight_loss') tdee -= 500;
  else if (goal === 'weight_gain') tdee += 500;

  return Math.round(tdee);
};

const FoodNutrition = require('../models/FoodNutrition');
const { Op } = require('sequelize');

const generateDietPlan = async (profile) => {
  const profileData = profile.toJSON ? profile.toJSON() : profile;
  const tdee = calculateCalories(profileData);
  let pref = 'non-veg';
  if (profileData.dietaryPreference === 'veg' || profileData.dietaryPreference === 'vegan') {
    pref = 'veg';
  }

  const getMeal = async (type, target) => {
    try {
      const dbMeals = await FoodNutrition.findAll({
        where: {
          category: { [Op.like]: `%${type}%` },
          calories: { [Op.between]: [target - 250, target + 250] }
        },
        limit: 5
      });

      if (dbMeals.length > 0) {
        const meal = dbMeals[Math.floor(Math.random() * dbMeals.length)];
        return { name: meal.name, calories: Math.round(meal.calories) };
      }
    } catch (err) {
      console.error(`DB Fetch Error for ${type}:`, err);
    }



    // Fallback to static DB
    const list = FOOD_DATABASE[pref][type];
    return list[Math.floor(Math.random() * list.length)];
  };

  const breakfast = await getMeal('breakfast', tdee * 0.25);
  const lunch = await getMeal('lunch', tdee * 0.35);
  const dinner = await getMeal('dinner', tdee * 0.40);

  return {
    tdee,
    meals: { breakfast, lunch, dinner },
    totalCalories: breakfast.calories + lunch.calories + dinner.calories
  };
};


module.exports = { calculateBMI, generateDietPlan, calculateCalories };
