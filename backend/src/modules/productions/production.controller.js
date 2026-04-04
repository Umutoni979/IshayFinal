const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');
const service = require('./production.service');

// ─── Core CRUD ────────────────────────────────────────────────
const getAll     = asyncHandler(async (req, res) => success(res, { productions: await service.getAll() }));
const getById    = asyncHandler(async (req, res) => success(res, { production: await service.getById(req.params.id) }));
const create     = asyncHandler(async (req, res) => success(res, { production: await service.create(req.body, req.user.id) }, 'Production created', 201));
const update     = asyncHandler(async (req, res) => success(res, { production: await service.update(req.params.id, req.body) }, 'Production updated'));
const remove     = asyncHandler(async (req, res) => { await service.remove(req.params.id); success(res, null, 'Production deleted'); });
const getMembers = asyncHandler(async (req, res) => success(res, { members: await service.getMembers(req.params.id) }));

// ─── Milestones ───────────────────────────────────────────────
const getMilestones   = asyncHandler(async (req, res) => success(res, { milestones: await service.getMilestones(req.params.id) }));
const seedMilestones  = asyncHandler(async (req, res) => success(res, { milestones: await service.seedMilestones(req.params.id) }, 'Default milestones created', 201));
const createMilestone = asyncHandler(async (req, res) => success(res, { milestone: await service.createMilestone(req.params.id, req.body) }, 'Milestone added', 201));
const updateMilestone = asyncHandler(async (req, res) => success(res, { milestone: await service.updateMilestone(req.params.id, req.params.milestoneId, req.body) }));
const deleteMilestone = asyncHandler(async (req, res) => { await service.deleteMilestone(req.params.id, req.params.milestoneId); success(res, null, 'Milestone deleted'); });

// ─── Events ──────────────────────────────────────────────────
const getEvents   = asyncHandler(async (req, res) => success(res, { events: await service.getEvents(req.params.id) }));
const createEvent = asyncHandler(async (req, res) => success(res, { event: await service.createEvent(req.params.id, req.body, req.user.id) }, 'Event added', 201));
const updateEvent = asyncHandler(async (req, res) => success(res, { event: await service.updateEvent(req.params.id, req.params.eventId, req.body) }));
const deleteEvent = asyncHandler(async (req, res) => { await service.deleteEvent(req.params.id, req.params.eventId); success(res, null, 'Event deleted'); });

// ─── Performance Report ───────────────────────────────────────
const getPerformanceReport  = asyncHandler(async (req, res) => success(res, { report: await service.getPerformanceReport(req.params.id) }));
const savePerformanceReport = asyncHandler(async (req, res) => success(res, { report: await service.savePerformanceReport(req.params.id, req.body, req.user.id) }, 'Report saved'));

// ─── Rehearsal Attendance ─────────────────────────────────────
const getRehearsalAttendance = asyncHandler(async (req, res) => success(res, { rehearsals: await service.getRehearsalAttendance(req.params.id) }));

module.exports = {
  getAll, getById, create, update, remove, getMembers,
  getMilestones, seedMilestones, createMilestone, updateMilestone, deleteMilestone,
  getEvents, createEvent, updateEvent, deleteEvent,
  getPerformanceReport, savePerformanceReport,
  getRehearsalAttendance,
};
