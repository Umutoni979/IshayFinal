const router = require('express').Router();
const auth = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const v = require('./rehearsal.validators');
const c = require('./rehearsal.controller');

router.get('/',                       auth, c.getAll);
router.get('/member/:memberId',        auth, c.getForMember);
router.get('/:id',                    auth, c.getById);
router.post('/',                      auth, authorize('director', 'coordinator'), validate(v.createRehearsal), c.create);
router.put('/:id',                    auth, authorize('director', 'coordinator'), validate(v.updateRehearsal), c.update);
router.delete('/:id',                 auth, authorize('director'),                c.remove);

module.exports = router;
