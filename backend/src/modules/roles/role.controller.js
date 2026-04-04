const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');
const service = require('./role.service');

const getAll  = asyncHandler(async (req, res) => success(res, { roles: await service.getAll(req.query) }));
const getById = asyncHandler(async (req, res) => success(res, { role: await service.getById(req.params.id) }));
const create  = asyncHandler(async (req, res) => success(res, { role: await service.create(req.body) }, 'Role created', 201));
const update  = asyncHandler(async (req, res) => success(res, { role: await service.update(req.params.id, req.body) }, 'Role updated'));
const remove  = asyncHandler(async (req, res) => { await service.remove(req.params.id); success(res, null, 'Role deleted'); });

const assign = asyncHandler(async (req, res) => {
  const notify = req.body.notify !== false;
  const role = await service.assign(req.params.id, req.body.member_id, req.user.id, notify);
  return success(res, { role }, 'Role assigned successfully');
});

const approve = asyncHandler(async (req, res) => {
  const role = await service.approve(req.params.id, req.user.id);
  return success(res, { role }, 'Role assignment approved');
});

module.exports = { getAll, getById, create, update, remove, assign, approve };
