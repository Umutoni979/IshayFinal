const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');
const service = require('./rehearsal.service');

const getAll       = asyncHandler(async (req, res) => success(res, { rehearsals: await service.getAll(req.query) }));
const getById      = asyncHandler(async (req, res) => success(res, { rehearsal: await service.getById(req.params.id) }));
const getForMember = asyncHandler(async (req, res) => success(res, { rehearsals: await service.getForMember(req.params.memberId) }));
const create       = asyncHandler(async (req, res) => success(res, { rehearsal: await service.create(req.body, req.user.id) }, 'Rehearsal created', 201));
const update       = asyncHandler(async (req, res) => success(res, { rehearsal: await service.update(req.params.id, req.body) }, 'Rehearsal updated'));
const remove       = asyncHandler(async (req, res) => { await service.remove(req.params.id); success(res, null, 'Rehearsal deleted'); });

module.exports = { getAll, getById, getForMember, create, update, remove };
