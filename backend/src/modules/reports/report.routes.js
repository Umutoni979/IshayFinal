const router = require('express').Router();
const auth = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const c = require('./report.controller');

router.get('/attendance',              auth, authorize('director', 'coordinator'), c.getAttendanceReport);
router.get('/production/:productionId', auth, authorize('director', 'coordinator'), c.getProductionReport);
router.get('/member/:memberId',         auth, authorize('director', 'coordinator'), c.getMemberPerformance);

module.exports = router;
