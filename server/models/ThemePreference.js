const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const User = require('./User');

const ThemePreference = sequelize.define('ThemePreference', {
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
  primaryColor: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '#2ecc71'
  }
});

ThemePreference.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });

module.exports = ThemePreference;
