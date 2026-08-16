const express = require('express');
const router = express.Router();
const {
  enhanceSummaryController,
  enhanceBulletController,
  analyzeJobDescriptionController,
  tailorResumeController,
  reviewResumeController,
  copilotChatController
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/enhance-summary', protect, enhanceSummaryController);
router.post('/enhance-bullet', protect, enhanceBulletController);
router.post('/analyze-jd', protect, analyzeJobDescriptionController);
router.post('/tailor-resume', protect, tailorResumeController);
router.post('/review-resume', protect, reviewResumeController);
router.post('/copilot-chat', protect, copilotChatController);

module.exports = router;
