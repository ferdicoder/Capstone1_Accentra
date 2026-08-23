import express from 'express';
import multer from 'multer';
import { uploadFileTemplate } from '../controllers/templateDocument.controller.js';

const templateRouter = express.Router();
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.has(file.mimetype)) {
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