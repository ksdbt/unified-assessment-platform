const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getActivityLogs,
  getSettings,
  updateSettings
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.get('/stats', protect, authorize('admin'), getDashboardStats);
router.get('/logs', protect, authorize('admin'), getActivityLogs);
router.get('/settings', protect, authorize('admin'), getSettings);
router.put('/settings', protect, authorize('admin'), updateSettings);

module.exports = router;