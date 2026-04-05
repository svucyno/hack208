const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const WaterIntake = sequelize.define('WaterIntake', {
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  amount: {
    type: DataTypes.INTEGER, // storted in ml
    allowNull: false,
    defaultValue: 0
  }
}, {
  indexes: [
    {
      unique: true,
      fields: ['userId', 'date']
    }
  ]
});

module.exports = WaterIntake;
