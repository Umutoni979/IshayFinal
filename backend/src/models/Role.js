const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Role = sequelize.define('Role', {
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
  requires_type: {
    type: DataTypes.ENUM('actor', 'crew'),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('open', 'assigned', 'approved'),
    defaultValue: 'open',
  },
  is_understudy: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'roles',
  timestamps: true,
  underscored: true,
});

module.exports = Role;
