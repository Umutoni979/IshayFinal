const router = require('express').Router();
const auth = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const c = require('./admin.controller');

router.get('/users',                   auth, authorize('director'), c.getAllUsers);
router.post('/users',                  auth, authorize('director'), c.createUser);
router.patch('/users/:id/status',      auth, authorize('director'), c.setUserStatus);
router.patch('/users/:id/role',        auth, authorize('director'), c.changeRole);
router.patch('/users/:id/permissions', auth, authorize('director'), c.updatePermissions);
router.put('/users/:id',               auth, authorize('director'), c.updateUser);
router.delete('/users/:id',            auth, authorize('director'), c.deleteUser);
router.post('/settings/registration',  auth, authorize('director'), c.toggleRegistration);
router.get('/settings/self-checkin',       auth, c.getSelfCheckinStatus);
router.post('/settings/self-checkin',      auth, authorize('director'), c.toggleSelfCheckin);
router.post('/settings/self-checkin/open', auth, authorize('director'), c.openSelfCheckin);

module.exports = router;
