import express from 'express';
import multer from 'multer';
import {
  uploadEngagementDocument,
  downloadEngagementDocument,
  deleteEngagementDocument,
} from '../controllers/engagementDocument.controller.js';
import { ALLOWED_FILE_TYPES } from '../config/allowedFileTypes.js';

const engagementDocumentRouter = express.Router();

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

engagementDocumentRouter
  .post(
    '/engagement-task/:engagementTaskId',
    upload.single('document'),
    uploadEngagementDocument
  )
  .get('/:docId/download', downloadEngagementDocument)
  .delete('/:docId', deleteEngagementDocument);

export default engagementDocumentRouter;