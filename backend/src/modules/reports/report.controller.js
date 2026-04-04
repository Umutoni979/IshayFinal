const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');
const service = require('./report.service');

const getAttendanceReport  = asyncHandler(async (req, res) => success(res, { report: await service.getAttendanceReport(req.query) }));
const getProductionReport  = asyncHandler(async (req, res) => success(res, { report: await service.getProductionReport(req.params.productionId) }));
const getMemberPerformance = asyncHandler(async (req, res) => success(res, { report: await service.getMemberPerformance(req.params.memberId) }));

module.exports = { getAttendanceReport, getProductionReport, getMemberPerformance };
