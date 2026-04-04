const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('director', 'coordinator', 'actor', 'crew', 'guest'),
    defaultValue: 'actor',
  },
  member_type: {
    type: DataTypes.ENUM('actor', 'crew'),
    allowNull: true,
  },
  phone: { type: DataTypes.STRING },
  profile_image: { type: DataTypes.STRING },
  bio: { type: DataTypes.TEXT },
  skills: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  // ── Verification & first-login flow ──────────────────────────
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  verification_code: { type: DataTypes.STRING },
  verification_expires: { type: DataTypes.DATE },
  must_change_password: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  // ── Per-user custom permissions granted by admin ─────────────
  // e.g. ['reports:read', 'attendance:write']
  custom_permissions: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  // ── Token fields ──────────────────────────────────────────────
  refresh_token: { type: DataTypes.TEXT },
  reset_password_token: { type: DataTypes.STRING },
  reset_password_expires: { type: DataTypes.DATE },
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
  },
});

User.prototype.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

User.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.password;
  delete values.refresh_token;
  delete values.reset_password_token;
  delete values.reset_password_expires;
  delete values.verification_code;
  delete values.verification_expires;
  return values;
};

module.exports = User;
