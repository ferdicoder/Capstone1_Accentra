import express from 'express';
import { uploadFileTemplate } from '../controllers/templateDocument.controller.js';
import { multerUpload } from '../middlewares/multerUpload.js';

const templateRouter = express.Router();


templateRouter.post(
  '/template/:templateTaskId',
  multerUpload.single('document'),
  uploadFileTemplate
);

export default templateRouter