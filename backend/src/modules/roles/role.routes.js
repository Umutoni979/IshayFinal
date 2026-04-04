const router = require('express').Router();
const auth = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const c = require('./role.controller');

router.get('/',                   auth,                                       c.getAll);
router.get('/:id',                auth,                                       c.getById);
router.post('/',                  auth, authorize('director', 'coordinator'), c.create);
router.put('/:id',                auth, authorize('director', 'coordinator'), c.update);
router.delete('/:id',             auth, authorize('director'),                c.remove);
router.post('/:id/assign',        auth, authorize('director', 'coordinator'), c.assign);
router.post('/:id/approve',       auth, authorize('director'),                c.approve);

module.exports = router;
