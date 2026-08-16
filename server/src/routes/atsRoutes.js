const express = require('express');
const router = express.Router();
const { analyzeATS, previewATS } = require('../controllers/atsController');
const { protect } = require('../middleware/authMiddleware');

router.post('/analyze', protect, analyzeATS);
router.post('/preview', protect, previewATS);

module.exports = router;
