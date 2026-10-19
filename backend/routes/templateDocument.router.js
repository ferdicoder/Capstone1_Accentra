import express from 'express';
import { uploadFileTemplate } from '../controllers/templateDocument.controller.js';
import { multerUpload } from '../middlewares/multerUpload.js';
import { authUser } from '../middlewares/authUser.js';
import { requireRole } from '../middlewares/requireRole.js';

const templateRouter = express.Router();


templateRouter.post(
  '/template/:templateTaskId',
  authUser,
  requireRole('admin'),
  multerUpload.single('document'),
  uploadFileTemplate
);

export default templateRouter