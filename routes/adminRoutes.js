const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthenticated, hasRole } = require('../middleware/authMiddleware');

// Protect all admin routes
router.use(isAuthenticated, hasRole('admin'));

router.get('/dashboard', adminController.getDashboard);

router.get('/requests', adminController.getRequests);
router.post('/request/:id/approve', adminController.postApproveRequest);
router.post('/request/:id/reject', adminController.postRejectRequest);
router.post('/request/:id/assign', adminController.postAssignRequest);
router.post('/request/:id/status', adminController.postUpdateStatus);

router.get('/agents', adminController.getAgents);
router.post('/agent/create', adminController.postCreateAgent);

router.get('/centres', adminController.getCentres);
router.post('/centre/create', adminController.postCreateCentre);
router.post('/centre/:id/edit', adminController.postEditCentre);

router.get('/categories', adminController.getCategories);
router.post('/category/create', adminController.postCreateCategory);
router.post('/category/:id/edit', adminController.postEditCategory);

router.get('/statistics', adminController.getStatistics);

module.exports = router;
