const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');
const service = require('./conflict.service');

const getAll      = asyncHandler(async (req, res) => success(res, { conflicts: await service.getAll(req.query) }));
const getById     = asyncHandler(async (req, res) => success(res, { conflict: await service.getById(req.params.id) }));
const getForMember = asyncHandler(async (req, res) => success(res, { conflicts: await service.getForMember(req.params.memberId) }));

const resolve = asyncHandler(async (req, res) => {
  const conflict = await service.resolve(req.params.id, req.body.resolution, req.user.id);
  return success(res, { conflict }, 'Conflict resolved');
});

const ignore = asyncHandler(async (req, res) => {
  const conflict = await service.ignore(req.params.id);
  return success(res, { conflict }, 'Conflict ignored');
});

module.exports = { getAll, getById, getForMember, resolve, ignore };
