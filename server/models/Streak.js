const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const User = require('./User');

const Streak = sequelize.define('Streak', {
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
  count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  lastActiveDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  }
});

Streak.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });

module.exports = Streak;
