const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const FoodNutrition = sequelize.define('FoodNutrition', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  calories: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  protein: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  carbs: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  fats: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  servingSize: {
    type: DataTypes.STRING,
    defaultValue: '100g'
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  dietaryType: {
    type: DataTypes.ENUM('veg', 'non-veg', 'vegan'),
    defaultValue: 'veg'
  }
});

module.exports = FoodNutrition;
