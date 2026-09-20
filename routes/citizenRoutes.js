const express = require('express');
const router = express.Router();
const citizenController = require('../controllers/citizenController');
const { isAuthenticated, hasRole } = require('../middleware/authMiddleware');

// Protect all citizen routes
router.use(isAuthenticated, hasRole('citizen'));

router.get('/dashboard', citizenController.getDashboard);

router.get('/pickup/new', citizenController.getNewPickup);
router.post('/pickup', citizenController.postNewPickup);

router.get('/pickups', citizenController.getPickups);
router.get('/pickup/:id', citizenController.getPickupDetail);

router.get('/wallet', citizenController.getWallet);
router.post('/wallet/redeem', citizenController.postRedeemPoints);

router.get('/leaderboard', citizenController.getLeaderboard);

module.exports = router;
