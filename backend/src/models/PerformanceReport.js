const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PerformanceReport = sequelize.define('PerformanceReport', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  production_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true, // one report per production
  },
  created_by_id: {
    type: DataTypes.UUID,
  },
  performance_date: { type: DataTypes.DATEONLY },
  venue:            { type: DataTypes.STRING },
  audience_count:   { type: DataTypes.INTEGER },
  summary:          { type: DataTypes.TEXT },
  outcomes:         { type: DataTypes.TEXT },
  observations:     { type: DataTypes.TEXT },
}, {
  tableName: 'performance_reports',
  timestamps: true,
  underscored: true,
});

module.exports = PerformanceReport;
