import multer from 'multer';
import { ALLOWED_FILE_TYPES } from '../config/allowedFileTypes.js';

export const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 mb
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_FILE_TYPES.has(file.mimetype)) {
      return cb(new Error('File type not allowed'));
    }
    cb(null, true);
  },
});

