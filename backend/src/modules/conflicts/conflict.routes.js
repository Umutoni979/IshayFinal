const router = require('express').Router();
const auth = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const c = require('./conflict.controller');

router.get('/',                  auth, authorize('director', 'coordinator'), c.getAll);
router.get('/member/:memberId',  auth,                                       c.getForMember);
router.get('/:id',               auth, authorize('director', 'coordinator'), c.getById);
router.put('/:id/resolve',       auth, authorize('director', 'coordinator'), c.resolve);
router.put('/:id/ignore',        auth, authorize('director', 'coordinator'), c.ignore);

module.exports = router;
