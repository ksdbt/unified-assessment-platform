const express = require('express');
const router = express.Router();
const {
  submitAssessment,
  getStudentSubmissions,
  getPendingSubmissions,
  getSubmissionsByAssessment,
  getAllSubmissions,
  evaluateSubmission
} = require('../controllers/submissionController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('student'), submitAssessment);
router.get('/student', protect, authorize('student'), getStudentSubmissions);
router.get('/pending', protect, authorize('instructor'), getPendingSubmissions);
router.get('/all', protect, authorize('admin'), getAllSubmissions);
router.get('/assessment/:id', protect, authorize('instructor', 'admin'), getSubmissionsByAssessment);
router.put('/:id/evaluate', protect, authorize('instructor'), evaluateSubmission);

module.exports = router;