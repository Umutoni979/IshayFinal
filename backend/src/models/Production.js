const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Production = sequelize.define('Production', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: { type: DataTypes.TEXT },
  start_date: { type: DataTypes.DATEONLY },
  end_date:   { type: DataTypes.DATEONLY },
  status: {
    type: DataTypes.ENUM('planning', 'active', 'completed', 'cancelled'),
    defaultValue: 'planning',
  },
  venue: { type: DataTypes.STRING },
}, {
  tableName: 'productions',
  timestamps: true,
  underscored: true,
});

module.exports = Production;
