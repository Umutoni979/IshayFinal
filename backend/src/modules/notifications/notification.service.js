const { Notification, User } = require('../../models');
const { sendEmail } = require('../../utils/emailService');

const getForUser = async (userId) => {
  return Notification.findAll({
    where: { recipient_id: userId },
    include: [{ model: User, as: 'sender', attributes: ['id', 'name'] }],
    order: [['created_at', 'DESC']],
  });
};

const send = async ({ recipient_ids, sender_id, type, title, body, channel = 'in_app', related_entity_type, related_entity_id }) => {
  const notifications = await Notification.bulkCreate(
    recipient_ids.map((rid) => ({
      recipient_id: rid,
      sender_id,
      type,
      title,
      body,
      channel,
      related_entity_type,
      related_entity_id,
    }))
  );

  // Send email if channel is email or all
  if (channel === 'email' || channel === 'all') {
    const recipients = await User.findAll({ where: { id: recipient_ids } });
    for (const user of recipients) {
      await sendEmail({ to: user.email, subject: title, html: `<p>${body}</p>` }).catch(() => {});
    }
  }

  return notifications;
};

const markRead = async (id, userId) => {
  const notification = await Notification.findOne({ where: { id, recipient_id: userId } });
  if (!notification) throw { statusCode: 404, message: 'Notification not found' };
  await notification.update({ is_read: true });
  return notification;
};

const markAllRead = async (userId) => {
  await Notification.update({ is_read: true }, { where: { recipient_id: userId, is_read: false } });
};

const remove = async (id, userId) => {
  const notification = await Notification.findOne({ where: { id, recipient_id: userId } });
  if (!notification) throw { statusCode: 404, message: 'Notification not found' };
  await notification.destroy();
};

module.exports = { getForUser, send, markRead, markAllRead, remove };
