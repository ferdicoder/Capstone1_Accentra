import express from 'express';
import multer from 'multer';
import { authUser } from '../middlewares/authUser.js';
import { requireRole } from '../middlewares/requireRole.js';
import {
  uploadFirmLogo,
  deleteFirmLogo,
  getFirmLogo,
} from '../controllers/firmSettings.controller.js';

// Logo-only upload: image types and a 2 MB cap matching the frontend limit.
// Kept local so the shared ALLOWED_FILE_TYPES allowlist (docs/PDFs) is untouched.
const logoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Logo must be a PNG, JPG, WebP or SVG image'));
    }
    cb(null, true);
  },
});

const firmSettingsRouter = express.Router();

firmSettingsRouter.get('/logo', getFirmLogo);
firmSettingsRouter.post(
  '/logo',
  authUser,
  requireRole('admin'),
  logoUpload.single('document'),
  uploadFirmLogo
);
firmSettingsRouter.delete('/logo', authUser, requireRole('admin'), deleteFirmLogo);

export default firmSettingsRouter;
