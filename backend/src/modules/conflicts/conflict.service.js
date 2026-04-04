const { Conflict, User, Rehearsal } = require('../../models');

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

module.exports = { getAll, getById, getForMember, resolve, ignore };
