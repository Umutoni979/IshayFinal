const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProductionMilestone = sequelize.define('ProductionMilestone', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  production_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.ENUM('costumes', 'props', 'venue', 'performance', 'other'),
    defaultValue: 'other',
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed'),
    defaultValue: 'pending',
  },
  due_date:     { type: DataTypes.DATEONLY },
  completed_at: { type: DataTypes.DATE },
  notes:        { type: DataTypes.TEXT },
  order_index:  { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'production_milestones',
  timestamps: true,
  underscored: true,
});

module.exports = ProductionMilestone;
