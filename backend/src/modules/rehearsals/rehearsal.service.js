const { Rehearsal, User, Production, Attendance } = require('../../models');
const { detectScheduleConflicts } = require('../../utils/conflictDetector');
const notificationService = require('../notifications/notification.service');
const { Op } = require('sequelize');

const getAll = async (filters = {}) => {
  const where = {};
  if (filters.production_id) where.production_id = filters.production_id;
  if (filters.date)          where.date          = filters.date;
  return Rehearsal.findAll({
    where,
    include: [
      { model: User, as: 'members', attributes: ['id', 'name', 'role'], through: { attributes: [] } },
      { model: Production, attributes: ['id', 'title'] },
      { model: User, as: 'created_by', attributes: ['id', 'name'] },
    ],
    order: [['date', 'ASC'], ['start_time', 'ASC']],
  });
};

const getById = async (id) => {
  const rehearsal = await Rehearsal.findByPk(id, {
    include: [
      { model: User, as: 'members', through: { attributes: [] } },
      { model: Production },
      { model: Attendance },
    ],
  });
  if (!rehearsal) throw { statusCode: 404, message: 'Rehearsal not found' };
  return rehearsal;
};

const getForMember = async (memberId) => {
  const user = await User.findByPk(memberId, {
    include: [{ model: Rehearsal, as: 'rehearsals', through: { attributes: [] } }],
  });
  if (!user) throw { statusCode: 404, message: 'User not found' };
  return user.rehearsals;
};

// Generate all dates for a recurring schedule
const buildDates = (startDate, recurrence, repeatUntil, daysOfWeek) => {
  const dates = [];
  const until = new Date(repeatUntil);
  const cur = new Date(startDate);
  cur.setHours(0, 0, 0, 0);
  until.setHours(0, 0, 0, 0);

  if (recurrence === 'once' || !repeatUntil) return [startDate];

  while (cur <= until) {
    const iso = cur.toISOString().slice(0, 10);
    if (recurrence === 'daily') {
      dates.push(iso);
    } else if (recurrence === 'weekly') {
      if ((daysOfWeek || []).includes(cur.getDay())) dates.push(iso);
    } else if (recurrence === 'monthly') {
      if (cur.getDate() === new Date(startDate).getDate()) dates.push(iso);
    }
    cur.setDate(cur.getDate() + 1);
  }
  return dates.length ? dates : [startDate];
};

const create = async (data, createdById) => {
  const { recurrence = 'once', repeat_until, days_of_week, member_ids, ...fields } = data;
  const dates = buildDates(fields.date, recurrence, repeat_until, days_of_week);

  const rehearsals = await Rehearsal.bulkCreate(
    dates.map(date => ({ ...fields, date, is_recurring: recurrence !== 'once', created_by_id: createdById })),
    { returning: true }
  );

  if (member_ids && member_ids.length > 0) {
    await Promise.all(rehearsals.map(r => r.setMembers(member_ids)));
  }
  await Promise.all(rehearsals.map(r => detectScheduleConflicts(r.id)));

  // Notify all active members
  const members = await User.findAll({
    where: { is_active: true, role: { [Op.in]: ['actor', 'crew', 'guest'] } },
    attributes: ['id'],
  });
  if (members.length > 0) {
    const first = rehearsals[0];
    notificationService.send({
      recipient_ids: members.map(m => m.id),
      sender_id: createdById,
      type: 'rehearsal_scheduled',
      title: 'New rehearsal scheduled',
      body: `"${first.title}" has been scheduled on ${first.date} at ${first.start_time}.`,
      related_entity_type: 'rehearsal',
      related_entity_id: first.id,
    }).catch(() => {});
  }

  return rehearsals.length === 1 ? rehearsals[0] : rehearsals;
};

const update = async (id, data) => {
  const rehearsal = await getById(id);
  await rehearsal.update(data);
  if (data.member_ids) {
    await rehearsal.setMembers(data.member_ids);
    await detectScheduleConflicts(id);
  }
  return rehearsal;
};

const remove = async (id) => {
  const rehearsal = await getById(id);
  await rehearsal.destroy();
};

module.exports = { getAll, getById, getForMember, create, update, remove };
