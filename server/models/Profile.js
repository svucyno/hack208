const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Profile = sequelize.define('Profile', {
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  weight: {
    type: DataTypes.FLOAT, // in kg
    allowNull: true
  },
  height: {
    type: DataTypes.FLOAT, // in cm
    allowNull: true
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other'),
    allowNull: true
  },
  goal: {
    type: DataTypes.ENUM('weight_loss', 'weight_gain', 'maintenance'),
    allowNull: true
  },
  dietaryPreference: {
    type: DataTypes.ENUM('veg', 'non-veg', 'vegan'),
    allowNull: true
  },
  allergies: {
    type: DataTypes.STRING, // Comma separated
    allowNull: true
  },
  avatar: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

module.exports = Profile;
