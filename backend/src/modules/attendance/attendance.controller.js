const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');
const service = require('./attendance.service');

const getByRehearsal        = asyncHandler(async (req, res) => success(res, { attendance: await service.getByRehearsal(req.params.rehearsalId) }));
const getByMember           = asyncHandler(async (req, res) => success(res, { attendance: await service.getByMember(req.params.memberId) }));
const mark                  = asyncHandler(async (req, res) => success(res, { record: await service.mark(req.body, req.user.id) }, 'Attendance marked', 201));
const update                = asyncHandler(async (req, res) => success(res, { record: await service.update(req.params.id, req.body) }, 'Attendance updated'));
const getSummaryByProduction = asyncHandler(async (req, res) => success(res, { summary: await service.getSummaryByProduction(req.params.productionId) }));
const selfCheckin            = asyncHandler(async (req, res) => success(res, { record: await service.selfCheckin(req.params.rehearsalId, req.user.id, req.body.status) }, 'Checked in successfully'));

module.exports = { getByRehearsal, getByMember, mark, update, getSummaryByProduction, selfCheckin };
