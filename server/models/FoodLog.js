const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const User = require('./User');

const FoodLog = sequelize.define('FoodLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  foodName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  calories: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  }
});

FoodLog.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });

module.exports = FoodLog;
