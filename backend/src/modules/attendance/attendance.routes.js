const router = require('express').Router();
const auth = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const c = require('./attendance.controller');

router.get('/rehearsal/:rehearsalId',       auth, authorize('director', 'coordinator'), c.getByRehearsal);
router.get('/member/:memberId',              auth,                                       c.getByMember);
router.get('/summary/:productionId',         auth, authorize('director', 'coordinator'), c.getSummaryByProduction);
router.post('/mark',                         auth, authorize('director', 'coordinator'), c.mark);
router.post('/self-checkin/:rehearsalId',    auth,                                       c.selfCheckin);
router.put('/:id',                           auth, authorize('director', 'coordinator'), c.update);

module.exports = router;
