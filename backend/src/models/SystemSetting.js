const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SystemSetting = sequelize.define('SystemSetting', {
  key:   { type: DataTypes.STRING, allowNull: false, unique: true },
  value: { type: DataTypes.STRING, allowNull: false },
}, {
  tableName:  'system_settings',
  timestamps: false,
});

module.exports = SystemSetting;
