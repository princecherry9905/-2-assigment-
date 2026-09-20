const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

router.post('/read-all', notificationController.markAllAsRead);
router.get('/read-all', notificationController.markAllAsRead);
router.post('/clear-all', notificationController.clearAllNotifications);
router.get('/clear-all', notificationController.clearAllNotifications);
router.get('/:id/read', notificationController.markAsRead);

module.exports = router;
