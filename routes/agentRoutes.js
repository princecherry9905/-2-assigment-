const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const { isAuthenticated, hasRole } = require('../middleware/authMiddleware');

// Protect all agent routes
router.use(isAuthenticated, hasRole('agent'));

router.get('/dashboard', agentController.getDashboard);
router.get('/pickups', agentController.getPickups);
router.get('/pickup/:id', agentController.getPickupDetail);
router.post('/pickup/:id/status', agentController.postUpdateStatus);

module.exports = router;
