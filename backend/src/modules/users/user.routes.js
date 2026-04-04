const router = require('express').Router();
const auth = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const controller = require('./user.controller');

router.get('/',                       auth, authorize('director', 'coordinator'), controller.getAllUsers);
router.get('/:id',                    auth,                                       controller.getUserById);
router.put('/:id',                    auth,                                       controller.updateUser);
router.delete('/:id',                 auth, authorize('director'),                controller.deleteUser);
router.patch('/:id/deactivate',       auth, authorize('director'),                controller.deactivateUser);
router.get('/:id/attendance-summary', auth,                                       controller.getAttendanceSummary);
router.get('/:id/assigned-roles',     auth,                                       controller.getAssignedRoles);
router.patch('/:id/avatar',           auth,                                       controller.updateAvatar);

module.exports = router;
