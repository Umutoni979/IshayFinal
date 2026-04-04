const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Rehearsal = sequelize.define('Rehearsal', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  start_time: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  end_time: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  location: { type: DataTypes.STRING },
  rehearsal_type: {
    type: DataTypes.STRING,
    defaultValue: 'full',
  },
  notes: { type: DataTypes.TEXT },
  is_recurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  checkin_closes_at: {
    type: DataTypes.TIME,
    allowNull: true,
  },
}, {
  tableName: 'rehearsals',
  timestamps: true,
  underscored: true,
});

module.exports = Rehearsal;
