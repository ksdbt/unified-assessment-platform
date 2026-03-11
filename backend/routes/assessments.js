const express = require('express');
const router = express.Router();
const {
  getAllAssessments,
  getStudentAssessments,
  getInstructorAssessments,
  getAdminAssessments,
  getAssessmentById,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  enrollStudents,
  getAssessmentIntegrityStats
} = require('../controllers/assessmentController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getAllAssessments);
router.get('/student', protect, authorize('student'), getStudentAssessments);
router.get('/instructor', protect, authorize('instructor'), getInstructorAssessments);
router.get('/admin', protect, authorize('admin'), getAdminAssessments);
router.get('/:id', protect, getAssessmentById);
router.post('/', protect, authorize('instructor', 'admin'), createAssessment);
router.put('/:id', protect, authorize('instructor', 'admin'), updateAssessment);
router.delete('/:id', protect, authorize('instructor', 'admin'), deleteAssessment);
router.post('/:id/enroll', protect, authorize('instructor', 'admin'), enrollStudents);
router.get('/:id/integrity-stats', protect, authorize('instructor', 'admin'), getAssessmentIntegrityStats);

module.exports = router;