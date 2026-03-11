const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/generate', aiController.generateQuizQuestions);
router.post('/explain', aiController.getExplanation);
router.post('/evaluate', aiController.autoEvaluate);
router.post('/suggest-metadata', aiController.suggestMetadata);

module.exports = router;
