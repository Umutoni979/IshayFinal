const router = require('express').Router();
const auth = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const c = require('./notification.controller');

router.get('/',                auth, c.getForUser);
router.post('/send',           auth, authorize('director', 'coordinator'), c.send);
router.put('/mark-all-read',   auth, c.markAllRead);
router.put('/:id/read',        auth, c.markRead);
router.delete('/:id',          auth, c.remove);

module.exports = router;
