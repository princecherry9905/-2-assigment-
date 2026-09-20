const Notification = require('../models/Notification');

/**
 * Helper to create user notifications
 */
exports.createNotification = async ({ userId, title, message, type = 'info', link = '/citizen/dashboard' }) => {
  try {
    if (!userId) return null;

    const newNotif = new Notification({
      user: userId,
      title,
      message,
      type,
      link
    });

    await newNotif.save();
    return newNotif;
  } catch (err) {
    console.error('Error creating notification:', err.message);
    return null;
  }
};
