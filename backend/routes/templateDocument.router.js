import express from 'express';
import multer from 'multer';
import { uploadFileTemplate } from '../controllers/templateDocument.controller.js';
import { ALLOWED_FILE_TYPES } from '../config/allowedFileTypes.js';

const templateRouter = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_FILE_TYPES.has(file.mimetype)) {
      return cb(new Error('File type not allowed'));
    }
    cb(null, true);
  },
});

templateRouter.post(
  '/template/:templateTaskId',
  upload.single('document'),
  uploadFileTemplate
);

export default templateRouter