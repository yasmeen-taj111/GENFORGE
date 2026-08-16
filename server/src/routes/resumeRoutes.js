const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getResumes,
  createResume,
  getResumeById,
  updateResume,
  deleteResume,
  duplicateResume,
  normalizeImportedResume,
  uploadResumeText
} = require('../controllers/resumeController');
const { protect } = require('../middleware/authMiddleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const extension = file.originalname.toLowerCase().split('.').pop();
    if (extension === 'pdf' || extension === 'docx') return callback(null, true);
    return callback(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'resume'));
  }
});

router.route('/')
  .get(protect, getResumes)
  .post(protect, createResume);

router.post('/upload', protect, upload.single('resume'), uploadResumeText);
router.post('/:id/normalize-import', protect, normalizeImportedResume);

router.route('/:id')
  .get(protect, getResumeById)
  .put(protect, updateResume)
  .delete(protect, deleteResume);

router.post('/:id/duplicate', protect, duplicateResume);

module.exports = router;
