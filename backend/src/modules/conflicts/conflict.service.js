const { Op } = require('sequelize');
const { Conflict, User, Rehearsal, Role, Production } = require('../../models');

const getAll = async (filters = {}) => {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.type)   where.type   = filters.type;
  return Conflict.findAll({
    where,
    include: [
      { model: User,     as: 'members',     attributes: ['id', 'name'], through: { attributes: [] } },
      { model: Rehearsal, as: 'rehearsals', attributes: ['id', 'title', 'date'], through: { attributes: [] } },
      { model: User,     as: 'resolved_by', attributes: ['id', 'name'] },
    ],
    order: [['detected_at', 'DESC']],
  });
};

const getById = async (id) => {
  const conflict = await Conflict.findByPk(id, {
    include: [
      { model: User, as: 'members', through: { attributes: [] } },
      { model: Rehearsal, as: 'rehearsals', through: { attributes: [] } },
    ],
  });
  if (!conflict) throw { statusCode: 404, message: 'Conflict not found' };
  return conflict;
};

const getForMember = async (memberId) => {
  const user = await User.findByPk(memberId, {
    include: [{ model: Conflict, as: 'conflicts', through: { attributes: [] } }],
  });
  if (!user) throw { statusCode: 404, message: 'User not found' };
  return user.conflicts;
};

const resolve = async (id, resolution, resolvedById) => {
  const conflict = await getById(id);
  await conflict.update({
    status: 'resolved',
    resolution,
    resolved_by_id: resolvedById,
    resolved_at: new Date(),
  });
  return conflict;
};

const ignore = async (id) => {
  const conflict = await getById(id);
  await conflict.update({ status: 'ignored' });
  return conflict;
};

// Returns true if two time ranges [s1,e1) and [s2,e2) overlap (string "HH:MM:SS" comparison)
const timesOverlap = (s1, e1, s2, e2) => s1 < e2 && s2 < e1;

const detectConflicts = async () => {
  // Get all role assignments grouped by member
  const assignments = await Role.findAll({
    where: { assigned_to_id: { [Op.not]: null } },
    attributes: ['assigned_to_id', 'production_id'],
    raw: true,
  });

  // memberProductions: { userId: Set<productionId> }
  const memberProductions = {};
  for (const a of assignments) {
    if (!memberProductions[a.assigned_to_id]) memberProductions[a.assigned_to_id] = new Set();
    memberProductions[a.assigned_to_id].add(a.production_id);
  }

  // Only members in 2+ productions can have schedule conflicts
  const candidates = Object.entries(memberProductions).filter(([, prods]) => prods.size > 1);

  let detected = 0;

  for (const [memberId, productionIds] of candidates) {
    const prodArray = [...productionIds];

    // Get all rehearsals for these productions with their production info
    const rehearsals = await Rehearsal.findAll({
      where: { production_id: { [Op.in]: prodArray } },
      include: [{ model: Production, attributes: ['id', 'title'] }],
    });

    // Group by date
    const byDate = {};
    for (const r of rehearsals) {
      if (!byDate[r.date]) byDate[r.date] = [];
      byDate[r.date].push(r);
    }

    for (const [date, dayRehearsals] of Object.entries(byDate)) {
      // Group by production
      const byProd = {};
      for (const r of dayRehearsals) {
        if (!byProd[r.production_id]) byProd[r.production_id] = [];
        byProd[r.production_id].push(r);
      }

      const prodGroups = Object.values(byProd);
      if (prodGroups.length < 2) continue; // Need rehearsals from at least 2 different productions

      // Check every pair of rehearsals from different productions
      for (let i = 0; i < prodGroups.length; i++) {
        for (let j = i + 1; j < prodGroups.length; j++) {
          for (const r1 of prodGroups[i]) {
            for (const r2 of prodGroups[j]) {
              if (!timesOverlap(r1.start_time, r1.end_time, r2.start_time, r2.end_time)) continue;

              // Check if this exact conflict already exists and is open
              const existing = await Conflict.findOne({
                where: { type: 'schedule', status: 'open' },
                include: [
                  { model: Rehearsal, as: 'rehearsals', where: { id: { [Op.in]: [r1.id, r2.id] } }, through: { attributes: [] }, required: true },
                  { model: User,      as: 'members',    where: { id: memberId },                     through: { attributes: [] }, required: true },
                ],
              });
              if (existing) continue;

              const member = await User.findByPk(memberId, { attributes: ['name'] });
              const prod1  = r1.Production?.title ?? 'Production A';
              const prod2  = r2.Production?.title ?? 'Production B';

              const conflict = await Conflict.create({
                type: 'schedule',
                severity: 'high',
                description: `${member.name} has overlapping rehearsals on ${date}: "${r1.title}" (${prod1}, ${r1.start_time}–${r1.end_time}) conflicts with "${r2.title}" (${prod2}, ${r2.start_time}–${r2.end_time})`,
              });
              await conflict.addMembers([memberId]);
              await conflict.addRehearsals([r1.id, r2.id]);
              detected++;
            }
          }
        }
      }
    }
  }

  return detected;
};

module.exports = { getAll, getById, getForMember, resolve, ignore, detectConflicts };
