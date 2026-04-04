const { Rehearsal, Role, Conflict, User } = require('../models');
const { Op } = require('sequelize');

// Detect time overlap for a member across rehearsals
const detectScheduleConflicts = async (rehearsalId) => {
  const rehearsal = await Rehearsal.findByPk(rehearsalId, {
    include: [{ model: User, as: 'members' }],
  });
  if (!rehearsal) return [];

  const conflicts = [];
  for (const member of rehearsal.members) {
    const overlapping = await Rehearsal.findAll({
      where: {
        id: { [Op.ne]: rehearsalId },
        date: rehearsal.date,
        [Op.or]: [
          { start_time: { [Op.between]: [rehearsal.start_time, rehearsal.end_time] } },
          { end_time:   { [Op.between]: [rehearsal.start_time, rehearsal.end_time] } },
          {
            start_time: { [Op.lte]: rehearsal.start_time },
            end_time:   { [Op.gte]: rehearsal.end_time },
          },
        ],
      },
      include: [{ model: User, as: 'members', where: { id: member.id } }],
    });

    if (overlapping.length > 0) {
      const existing = await Conflict.findOne({
        where: { type: 'schedule', status: 'open' },
        include: [{ model: User, as: 'members', where: { id: member.id } }],
      });
      if (!existing) {
        const conflict = await Conflict.create({
          type: 'schedule',
          description: `Schedule overlap for ${member.name} on ${rehearsal.date}`,
          status: 'open',
        });
        await conflict.addMembers([member.id]);
        await conflict.addRehearsals([rehearsalId, ...overlapping.map((r) => r.id)]);
        conflicts.push(conflict);
      }
    }
  }
  return conflicts;
};

module.exports = { detectScheduleConflicts };
