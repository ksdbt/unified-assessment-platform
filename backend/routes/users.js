const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getStudents,
  createUser,
  updateUser,
  deleteUser,
  getInstructorStudentOverview
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin'), getAllUsers);
router.get('/students', protect, authorize('admin', 'instructor'), getStudents);
router.get('/instructor/overview', protect, authorize('instructor'), getInstructorStudentOverview);
router.post('/', protect, authorize('admin'), createUser);
router.put('/:id', protect, authorize('admin'), updateUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;