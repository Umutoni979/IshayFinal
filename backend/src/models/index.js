const { sequelize } = require('../config/database');
const User               = require('./User');
const UserSession        = require('./UserSession');
const SystemSetting      = require('./SystemSetting');
const ProductionMilestone = require('./ProductionMilestone');
const ProductionEvent     = require('./ProductionEvent');
const PerformanceReport   = require('./PerformanceReport');
const Production   = require('./Production');
const Role         = require('./Role');
const Rehearsal    = require('./Rehearsal');
const Attendance   = require('./Attendance');
const Conflict     = require('./Conflict');
const Notification = require('./Notification');
const Availability = require('./Availability');

// ─── UserSession associations ─────────────────────────────────
User.hasMany(UserSession,    { foreignKey: 'user_id', onDelete: 'CASCADE' });
UserSession.belongsTo(User,  { foreignKey: 'user_id' });

// ─── Production Core associations ────────────────────────────
Production.hasMany(ProductionMilestone, { foreignKey: 'production_id', as: 'milestones', onDelete: 'CASCADE' });
ProductionMilestone.belongsTo(Production, { foreignKey: 'production_id' });

Production.hasMany(ProductionEvent, { foreignKey: 'production_id', as: 'events', onDelete: 'CASCADE' });
ProductionEvent.belongsTo(Production, { foreignKey: 'production_id' });
ProductionEvent.belongsTo(User, { foreignKey: 'created_by_id', as: 'created_by' });

Production.hasOne(PerformanceReport, { foreignKey: 'production_id', as: 'performance_report', onDelete: 'CASCADE' });
PerformanceReport.belongsTo(Production, { foreignKey: 'production_id' });
PerformanceReport.belongsTo(User, { foreignKey: 'created_by_id', as: 'created_by' });

// ─── Production associations ──────────────────────────────────
Production.belongsTo(User, { as: 'director', foreignKey: 'director_id' });
User.hasMany(Production,   { as: 'directed_productions', foreignKey: 'director_id' });

// Coordinators junction
const ProductionCoordinator = sequelize.define('ProductionCoordinator', {}, {
  tableName: 'production_coordinators',
  timestamps: false,
});
Production.belongsToMany(User, { through: ProductionCoordinator, as: 'coordinators', foreignKey: 'production_id' });
User.belongsToMany(Production, { through: ProductionCoordinator, as: 'coordinated_productions', foreignKey: 'user_id' });

// ─── Role associations ────────────────────────────────────────
Role.belongsTo(Production, { foreignKey: 'production_id' });
Production.hasMany(Role,   { foreignKey: 'production_id' });

Role.belongsTo(User, { as: 'assigned_to', foreignKey: 'assigned_to_id' });
Role.belongsTo(User, { as: 'suggested_by', foreignKey: 'suggested_by_id' });
Role.belongsTo(User, { as: 'approved_by', foreignKey: 'approved_by_id' });

// ─── Rehearsal associations ───────────────────────────────────
Rehearsal.belongsTo(Production, { foreignKey: 'production_id' });
Production.hasMany(Rehearsal,   { foreignKey: 'production_id' });

Rehearsal.belongsTo(User, { as: 'created_by', foreignKey: 'created_by_id' });

const RehearsalMember = sequelize.define('RehearsalMember', {}, {
  tableName: 'rehearsal_members',
  timestamps: false,
});
Rehearsal.belongsToMany(User, { through: RehearsalMember, as: 'members', foreignKey: 'rehearsal_id' });
User.belongsToMany(Rehearsal, { through: RehearsalMember, as: 'rehearsals', foreignKey: 'user_id' });

// ─── Attendance associations ──────────────────────────────────
Attendance.belongsTo(Rehearsal, { foreignKey: 'rehearsal_id' });
Rehearsal.hasMany(Attendance,   { foreignKey: 'rehearsal_id' });

Attendance.belongsTo(User, { as: 'member',    foreignKey: 'member_id' });
Attendance.belongsTo(User, { as: 'marked_by', foreignKey: 'marked_by_id' });
User.hasMany(Attendance,   { as: 'attendance_records', foreignKey: 'member_id' });

// ─── Conflict associations ────────────────────────────────────
const ConflictMember = sequelize.define('ConflictMember', {}, {
  tableName: 'conflict_members',
  timestamps: false,
});
Conflict.belongsToMany(User,      { through: ConflictMember, as: 'members',    foreignKey: 'conflict_id' });
User.belongsToMany(Conflict,      { through: ConflictMember, as: 'conflicts',   foreignKey: 'user_id' });

const ConflictRehearsal = sequelize.define('ConflictRehearsal', {}, {
  tableName: 'conflict_rehearsals',
  timestamps: false,
});
Conflict.belongsToMany(Rehearsal, { through: ConflictRehearsal, as: 'rehearsals', foreignKey: 'conflict_id' });
Rehearsal.belongsToMany(Conflict, { through: ConflictRehearsal, as: 'conflicts',  foreignKey: 'rehearsal_id' });

Conflict.belongsTo(User, { as: 'resolved_by', foreignKey: 'resolved_by_id' });

// ─── Notification associations ────────────────────────────────
Notification.belongsTo(User, { as: 'recipient', foreignKey: 'recipient_id' });
Notification.belongsTo(User, { as: 'sender',    foreignKey: 'sender_id' });
User.hasMany(Notification,   { as: 'notifications', foreignKey: 'recipient_id' });

// ─── Availability associations ────────────────────────────────
Availability.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Availability,   { foreignKey: 'user_id' });

module.exports = {
  sequelize,
  User,
  UserSession,
  SystemSetting,
  ProductionMilestone,
  ProductionEvent,
  PerformanceReport,
  Production,
  Role,
  Rehearsal,
  Attendance,
  Conflict,
  Notification,
  Availability,
  ProductionCoordinator,
  RehearsalMember,
  ConflictMember,
  ConflictRehearsal,
};
