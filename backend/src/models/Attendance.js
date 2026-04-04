const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Attendance = sequelize.define('Attendance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  status: {
    type: DataTypes.ENUM('present', 'absent', 'excused', 'late'),
    allowNull: false,
  },
  check_in_time:  { type: DataTypes.TIME },
  check_out_time: { type: DataTypes.TIME },
  notes:          { type: DataTypes.TEXT },
  excuse_reason:  { type: DataTypes.TEXT },
}, {
  tableName: 'attendance',
  timestamps: true,
  underscored: true,
});

module.exports = Attendance;
