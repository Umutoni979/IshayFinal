const router = require('express').Router();
const auth = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const v = require('./production.validators');
const c = require('./production.controller');

// ─── Core ─────────────────────────────────────────────────────
router.get('/',             auth,                                        c.getAll);
router.get('/:id',          auth,                                        c.getById);
router.get('/:id/members',  auth,                                        c.getMembers);
router.post('/',            auth, authorize('director'),                  validate(v.createProduction),  c.create);
router.put('/:id',          auth, authorize('director'),                  validate(v.updateProduction),  c.update);
router.delete('/:id',       auth, authorize('director'),                  c.remove);

// ─── Milestones ───────────────────────────────────────────────
router.get('/:id/milestones',                   auth,                                       c.getMilestones);
router.post('/:id/milestones/seed',             auth, authorize('director','coordinator'),   c.seedMilestones);
router.post('/:id/milestones',                  auth, authorize('director','coordinator'),   validate(v.createMilestone),        c.createMilestone);
router.put('/:id/milestones/:milestoneId',       auth, authorize('director','coordinator'),   validate(v.updateMilestone),        c.updateMilestone);
router.delete('/:id/milestones/:milestoneId',    auth, authorize('director'),                 c.deleteMilestone);

// ─── Events ──────────────────────────────────────────────────
router.get('/:id/events',                       auth,                                       c.getEvents);
router.post('/:id/events',                      auth, authorize('director','coordinator'),   validate(v.createEvent),            c.createEvent);
router.put('/:id/events/:eventId',              auth, authorize('director','coordinator'),   validate(v.updateEvent),            c.updateEvent);
router.delete('/:id/events/:eventId',           auth, authorize('director','coordinator'),   c.deleteEvent);

// ─── Performance Report ───────────────────────────────────────
router.get('/:id/performance-report',           auth,                                       c.getPerformanceReport);
router.post('/:id/performance-report',          auth, authorize('director','coordinator'),   validate(v.savePerformanceReport),  c.savePerformanceReport);

// ─── Rehearsal Attendance ─────────────────────────────────────
router.get('/:id/rehearsal-attendance',         auth,                                       c.getRehearsalAttendance);

module.exports = router;
