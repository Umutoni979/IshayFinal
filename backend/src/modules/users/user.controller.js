const path        = require('path');
const fs          = require('fs');
const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');
const userService = require('./user.service');
const { uploadAvatar } = require('../../middleware/upload');

const getAllUsers = asyncHandler(async (req, res) => {
  const result = await userService.getAllUsers(req.query);
  return success(res, result);
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  return success(res, { user });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body, req.user.id, req.user.role);
  return success(res, { user }, 'User updated successfully');
});

const deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id);
  return success(res, null, 'User deleted successfully');
});

const deactivateUser = asyncHandler(async (req, res) => {
  const user = await userService.deactivateUser(req.params.id);
  return success(res, { user }, 'User deactivated');
});

const getAttendanceSummary = asyncHandler(async (req, res) => {
  const summary = await userService.getUserAttendanceSummary(req.params.id);
  return success(res, { summary });
});

const getAssignedRoles = asyncHandler(async (req, res) => {
  const roles = await userService.getUserAssignedRoles(req.params.id);
  return success(res, { roles });
});

const updateAvatar = (req, res, next) => {
  uploadAvatar(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    try {
      const user = await userService.getUserById(req.params.id);

      // Only owner or director can update avatar
      if (req.user.role !== 'director' && req.user.id !== req.params.id) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }

      // Delete old avatar file if it exists and is a local file
      if (user.profile_image) {
        const oldPath = path.join(__dirname, '../../../', user.profile_image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      const imageUrl = `/uploads/avatars/${req.file.filename}`;
      await user.update({ profile_image: imageUrl });

      return success(res, { profile_image: imageUrl }, 'Avatar updated successfully');
    } catch (e) {
      next(e);
    }
  });
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser, deactivateUser, getAttendanceSummary, getAssignedRoles, updateAvatar };
