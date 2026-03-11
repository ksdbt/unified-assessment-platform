const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getActivityLogs,
  getSettings,
  updateSettings,
  seedDemoData,
  getLedger,
  publishLedger
} = require('../controllers/adminController');
const {
  verifyLogIntegrity,
  getSuspiciousActivity,
  getSessionReplay,
  detectCollusion,
  getAuditLogs,
  runPatternAnalysis,
  getNetworkGraphData
} = require('../controllers/auditController');
const { protect, authorize } = require('../middleware/auth');

// ─── Standard Admin Routes ─────────────────────────────────────────
router.get('/stats', protect, authorize('admin'), getDashboardStats);
router.get('/settings', protect, authorize('admin'), getSettings);
router.put('/settings', protect, authorize('admin'), updateSettings);

// ─── Tiered Audit Log Access () ────────────────────
// Admin: all logs. Instructor: their assessment logs. Student: own session logs.
router.get('/logs', protect, authorize('admin', 'instructor', 'student'), getAuditLogs);

// ─── Routes ─────────────────────────────────────────
// SHA-256 Hash Chain Integrity Verification
router.get('/logs/verify', protect, authorize('admin'), verifyLogIntegrity);

// Suspicious Activity (Anomaly Scores)
router.get('/suspicious', protect, authorize('admin', 'instructor'), getSuspiciousActivity);

// Session Replay (per-student behavioral timeline)
router.get('/replay/:submissionId', protect, authorize('admin', 'instructor'), getSessionReplay);

// Cross-Student Collusion Detection (Jaccard Similarity)
router.get('/collusion/:assessmentId', protect, authorize('admin', 'instructor'), detectCollusion);

// Run Cheating Ring Detector
router.post('/pattern-analysis', protect, authorize('admin'), runPatternAnalysis);

// Cheating Network Graph (Collusion Clusters)
router.get('/network-graph/:assessmentId', protect, authorize('admin', 'instructor'), getNetworkGraphData);

// Transparency Ledger (Simulated Blockchain)
router.get('/ledger', protect, authorize('admin'), getLedger);
router.post('/ledger/publish', protect, authorize('admin'), publishLedger);

// Demo Seeding
router.post('/seed-demo', seedDemoData);

module.exports = router;