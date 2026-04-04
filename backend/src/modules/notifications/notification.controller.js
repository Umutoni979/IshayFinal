const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');
const service = require('./notification.service');

const getForUser = asyncHandler(async (req, res) => success(res, { notifications: await service.getForUser(req.user.id) }));

const send = asyncHandler(async (req, res) => {
  const notifications = await service.send({ ...req.body, sender_id: req.user.id });
  return success(res, { notifications }, 'Notification(s) sent', 201);
});

const markRead    = asyncHandler(async (req, res) => success(res, { notification: await service.markRead(req.params.id, req.user.id) }, 'Marked as read'));
const markAllRead = asyncHandler(async (req, res) => { await service.markAllRead(req.user.id); success(res, null, 'All marked as read'); });
const remove      = asyncHandler(async (req, res) => { await service.remove(req.params.id, req.user.id); success(res, null, 'Notification deleted'); });

module.exports = { getForUser, send, markRead, markAllRead, remove };
