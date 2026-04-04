const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Conflict = sequelize.define('Conflict', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  type: {
    type: DataTypes.ENUM('schedule', 'role', 'availability'),
    allowNull: false,
  },
  description: { type: DataTypes.TEXT },
  status: {
    type: DataTypes.ENUM('open', 'resolved', 'ignored'),
    defaultValue: 'open',
  },
  resolution: { type: DataTypes.TEXT },
  severity: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium',
  },
  detected_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  resolved_at: { type: DataTypes.DATE },
}, {
  tableName: 'conflicts',
  timestamps: true,
  underscored: true,
});

module.exports = Conflict;
