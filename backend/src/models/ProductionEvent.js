const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProductionEvent = sequelize.define('ProductionEvent', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  production_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  created_by_id: {
    type: DataTypes.UUID,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: { type: DataTypes.TEXT },
  event_date:   { type: DataTypes.DATEONLY, allowNull: false },
  event_time:   { type: DataTypes.TIME },
  event_type: {
    type: DataTypes.ENUM('meeting', 'fitting', 'venue_visit', 'technical', 'dress_rehearsal', 'other'),
    defaultValue: 'other',
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'completed', 'cancelled'),
    defaultValue: 'scheduled',
  },
}, {
  tableName: 'production_events',
  timestamps: true,
  underscored: true,
});

module.exports = ProductionEvent;
