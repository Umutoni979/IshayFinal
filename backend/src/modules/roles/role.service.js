const { Role, User, Production } = require('../../models');
const notificationService = require('../notifications/notification.service');

const getAll = async (filters = {}) => {
  const where = {};
  if (filters.production_id) where.production_id = filters.production_id;
  if (filters.status)        where.status        = filters.status;
  return Role.findAll({
    where,
    include: [
      { model: User, as: 'assigned_to',  attributes: ['id', 'name', 'role', 'member_type'] },
      { model: User, as: 'suggested_by', attributes: ['id', 'name'] },
      { model: User, as: 'approved_by',  attributes: ['id', 'name'] },
      { model: Production, attributes: ['id', 'title'] },
    ],
  });
};

const getById = async (id) => {
  const role = await Role.findByPk(id, {
    include: [
      { model: User, as: 'assigned_to' },
      { model: Production },
    ],
  });
  if (!role) throw { statusCode: 404, message: 'Role not found' };
  return role;
};

const create = async (data) => Role.create(data);

const update = async (id, data) => {
  const role = await getById(id);
  await role.update(data);
  return role;
};

const assign = async (roleId, memberId, suggestedById, notify = true) => {
  const role = await getById(roleId);
  const member = await User.findByPk(memberId);
  if (!member) throw { statusCode: 404, message: 'Member not found' };
  if (role.requires_type && member.member_type !== role.requires_type) {
    throw { statusCode: 400, message: `This role requires a ${role.requires_type}` };
  }
  await role.update({ assigned_to_id: memberId, suggested_by_id: suggestedById, approved_by_id: suggestedById, status: 'approved' });

  // Notify the assigned member (only on first assignment, not on reassign/update)
  if (notify) {
  const production = role.production_id ? await Production.findByPk(role.production_id, { attributes: ['title'] }) : null;
  notificationService.send({
    recipient_ids: [memberId],
    sender_id: suggestedById,
    type: 'role_assigned',
    title: 'You have been assigned a role',
    body: `You have been assigned the role "${role.title}"${production ? ` in ${production.title}` : ''}.`,
  }).catch(() => {});
  }

  return role;
};

const approve = async (roleId, directorId) => {
  const role = await getById(roleId);
  if (role.status !== 'assigned') throw { statusCode: 400, message: 'Role must be assigned before approval' };
  await role.update({ status: 'approved', approved_by_id: directorId });
  return role;
};

const remove = async (id) => {
  const role = await getById(id);
  await role.destroy();
};

module.exports = { getAll, getById, create, update, assign, approve, remove };
