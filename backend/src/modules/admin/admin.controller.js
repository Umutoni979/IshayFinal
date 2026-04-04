const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');
const service = require('./admin.service');

const getAllUsers        = asyncHandler(async (req, res) => success(res, { users: await service.getAllUsers() }));
const createUser        = asyncHandler(async (req, res) => success(res, { user: await service.createUser(req.body) }, 'User created successfully', 201));
const setUserStatus     = asyncHandler(async (req, res) => success(res, { user: await service.setUserStatus(req.params.id, req.body.is_active) }, 'Status updated'));
const changeRole        = asyncHandler(async (req, res) => success(res, { user: await service.changeUserRole(req.params.id, req.body.role) }, 'Role updated'));
const updatePermissions  = asyncHandler(async (req, res) => success(res, { user: await service.updateUserPermissions(req.params.id, req.body.custom_permissions) }, 'Permissions updated'));
const toggleRegistration  = asyncHandler(async (req, res) => success(res, { enabled: await service.toggleRegistration(req.body.enable) }, 'Registration setting updated'));
const toggleSelfCheckin    = asyncHandler(async (req, res) => success(res, { enabled: await service.toggleSelfCheckin(req.body.enable) }, 'Self check-in setting updated'));
const getSelfCheckinStatus = asyncHandler(async (req, res) => success(res, await service.getSelfCheckinStatus()));
const setSelfCheckinCutoff = asyncHandler(async (req, res) => success(res, { cutoff: await service.setSelfCheckinCutoff(req.body.cutoff) }, 'Cutoff time saved'));
const updateUser  = asyncHandler(async (req, res) => success(res, { user: await service.updateUser(req.params.id, req.body, req.user.id) }, 'User updated'));
const deleteUser  = asyncHandler(async (req, res) => { await service.deleteUser(req.params.id, req.user.id); success(res, null, 'User deleted'); });

module.exports = { getAllUsers, createUser, setUserStatus, changeRole, updatePermissions, toggleRegistration, toggleSelfCheckin, getSelfCheckinStatus, setSelfCheckinCutoff, updateUser, deleteUser };
