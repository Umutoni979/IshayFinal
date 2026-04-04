const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Availability = sequelize.define('Availability', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  is_available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  start_time: { type: DataTypes.TIME },
  end_time:   { type: DataTypes.TIME },
  notes:      { type: DataTypes.TEXT },
}, {
  tableName: 'availability',
  timestamps: true,
  underscored: true,
});

module.exports = Availability;
