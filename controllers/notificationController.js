const Notification = require('../models/Notification');

exports.markAllAsRead = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    await Notification.updateMany(
      { user: req.session.user._id, isRead: false },
      { isRead: true }
    );

    req.flash('success_msg', 'All notifications marked as read.');
    res.redirect('back');
  } catch (err) {
    console.error('Mark All Notifications Error:', err);
    res.redirect('back');
  }
};

exports.markAsRead = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const notif = await Notification.findOne({
      _id: req.params.id,
      user: req.session.user._id
    });

    if (notif) {
      notif.isRead = true;
      await notif.save();
      return res.redirect(notif.link || 'back');
    }

    res.redirect('back');
  } catch (err) {
    console.error('Mark Notification Error:', err);
    res.redirect('back');
  }
};

exports.clearAllNotifications = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    await Notification.deleteMany({ user: req.session.user._id });
    req.flash('success_msg', 'Notifications cleared.');
    res.redirect('back');
  } catch (err) {
    console.error('Clear Notifications Error:', err);
    res.redirect('back');
  }
};
