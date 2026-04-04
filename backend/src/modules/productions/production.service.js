const { Op } = require('sequelize');
const {
  Production, User, Role, Rehearsal, Attendance,
  ProductionMilestone, ProductionEvent, PerformanceReport,
} = require('../../models');

// ─── Default milestones auto-created with every production ───
const DEFAULT_MILESTONES = [
  { title: 'Costumes & Clothing confirmed',  category: 'costumes',    order_index: 1 },
  { title: 'Props & Materials acquired',     category: 'props',       order_index: 2 },
  { title: 'Venue / Hall readiness confirmed', category: 'venue',     order_index: 3 },
  { title: 'Technical setup completed',      category: 'other',       order_index: 4 },
  { title: 'Dress rehearsal done',           category: 'performance', order_index: 5 },
  { title: 'Performance day ready',          category: 'performance', order_index: 6 },
];

// ─── Core production CRUD ─────────────────────────────────────

const getAll = async () => {
  return Production.findAll({
    include: [
      { model: User, as: 'director', attributes: ['id', 'name', 'email'] },
      { model: User, as: 'coordinators', attributes: ['id', 'name', 'email'], through: { attributes: [] } },
    ],
    order: [['created_at', 'DESC']],
  });
};

const getById = async (id) => {
  const production = await Production.findByPk(id, {
    include: [
      { model: User, as: 'director',     attributes: ['id', 'name', 'email'] },
      { model: User, as: 'coordinators', attributes: ['id', 'name', 'email'], through: { attributes: [] } },
      { model: Role },
      { model: Rehearsal },
    ],
  });
  if (!production) throw { statusCode: 404, message: 'Production not found' };
  return production;
};

const create = async (data, directorId) => {
  const production = await Production.create({ ...data, director_id: directorId });
  // Auto-create default milestones
  await ProductionMilestone.bulkCreate(
    DEFAULT_MILESTONES.map(m => ({ ...m, production_id: production.id }))
  );
  return production;
};

const update = async (id, data) => {
  const production = await getById(id);
  await production.update(data);
  return production;
};

const remove = async (id) => {
  const production = await getById(id);
  await production.destroy();
};

const getMembers = async (id) => {
  const roles = await Role.findAll({
    where: { production_id: id },
    include: [{ model: User, as: 'assigned_to', attributes: ['id', 'name', 'role', 'member_type'] }],
  });
  return roles.filter((r) => r.assigned_to).map((r) => r.assigned_to);
};

// ─── Milestones ───────────────────────────────────────────────

const getMilestones = async (productionId) => {
  return ProductionMilestone.findAll({
    where: { production_id: productionId },
    order: [['order_index', 'ASC'], ['created_at', 'ASC']],
  });
};

const seedMilestones = async (productionId) => {
  const existing = await ProductionMilestone.count({ where: { production_id: productionId } });
  if (existing > 0) throw { statusCode: 409, message: 'Milestones already exist for this production' };
  await ProductionMilestone.bulkCreate(
    DEFAULT_MILESTONES.map(m => ({ ...m, production_id: productionId }))
  );
  return getMilestones(productionId);
};

const createMilestone = async (productionId, data) => {
  return ProductionMilestone.create({ ...data, production_id: productionId });
};

const updateMilestone = async (productionId, milestoneId, data) => {
  const milestone = await ProductionMilestone.findOne({ where: { id: milestoneId, production_id: productionId } });
  if (!milestone) throw { statusCode: 404, message: 'Milestone not found' };
  if (data.status === 'completed' && !milestone.completed_at) data.completed_at = new Date();
  if (data.status !== 'completed') data.completed_at = null;
  await milestone.update(data);
  return milestone;
};

const deleteMilestone = async (productionId, milestoneId) => {
  const milestone = await ProductionMilestone.findOne({ where: { id: milestoneId, production_id: productionId } });
  if (!milestone) throw { statusCode: 404, message: 'Milestone not found' };
  await milestone.destroy();
};

// ─── Events ──────────────────────────────────────────────────

const getEvents = async (productionId) => {
  return ProductionEvent.findAll({
    where: { production_id: productionId },
    include: [{ model: User, as: 'created_by', attributes: ['id', 'name'] }],
    order: [['event_date', 'ASC'], ['event_time', 'ASC']],
  });
};

const createEvent = async (productionId, data, userId) => {
  return ProductionEvent.create({ ...data, production_id: productionId, created_by_id: userId });
};

const updateEvent = async (productionId, eventId, data) => {
  const event = await ProductionEvent.findOne({ where: { id: eventId, production_id: productionId } });
  if (!event) throw { statusCode: 404, message: 'Event not found' };
  await event.update(data);
  return event;
};

const deleteEvent = async (productionId, eventId) => {
  const event = await ProductionEvent.findOne({ where: { id: eventId, production_id: productionId } });
  if (!event) throw { statusCode: 404, message: 'Event not found' };
  await event.destroy();
};

// ─── Performance Report ───────────────────────────────────────

const getPerformanceReport = async (productionId) => {
  return PerformanceReport.findOne({
    where: { production_id: productionId },
    include: [{ model: User, as: 'created_by', attributes: ['id', 'name'] }],
  });
};

const savePerformanceReport = async (productionId, data, userId) => {
  const existing = await PerformanceReport.findOne({ where: { production_id: productionId } });
  if (existing) {
    await existing.update(data);
    return existing;
  }
  return PerformanceReport.create({ ...data, production_id: productionId, created_by_id: userId });
};

// ─── Rehearsal Attendance Summary (for this production) ──────

const getRehearsalAttendance = async (productionId) => {
  const rehearsals = await Rehearsal.findAll({
    where: { production_id: productionId },
    include: [{
      model: Attendance,
      include: [{ model: User, as: 'member', attributes: ['id', 'name', 'role'] }],
    }],
    order: [['date', 'ASC']],
  });

  return rehearsals.map(r => {
    const records = r.Attendances || [];
    const counts = { present: 0, absent: 0, late: 0, excused: 0 };
    records.forEach(a => { if (counts[a.status] !== undefined) counts[a.status]++; });
    const total = records.length;
    const rate  = total > 0 ? Math.round((counts.present + counts.late) / total * 100) : null;
    return {
      id:             r.id,
      title:          r.title,
      date:           r.date,
      rehearsal_type: r.rehearsal_type,
      location:       r.location,
      counts,
      total,
      attendance_rate: rate,
      records: records.map(a => ({
        id:     a.id,
        status: a.status,
        member: a.member,
        check_in_time:  a.check_in_time,
        excuse_reason:  a.excuse_reason,
      })),
    };
  });
};

module.exports = {
  getAll, getById, create, update, remove, getMembers,
  getMilestones, seedMilestones, createMilestone, updateMilestone, deleteMilestone,
  getEvents, createEvent, updateEvent, deleteEvent,
  getPerformanceReport, savePerformanceReport,
  getRehearsalAttendance,
};
