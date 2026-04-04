const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserSession = sequelize.define('UserSession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  ip_address: { type: DataTypes.STRING },
  user_agent: { type: DataTypes.TEXT },
}, {
  tableName: 'user_login_sessions',
  timestamps: true,
  underscored: true,
  updatedAt: false, // only track created_at (= login time)
});

module.exports = UserSession;
