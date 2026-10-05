import express from 'express';
import {
  uploadEngagementDocument,
  downloadEngagementDocument,
  deleteEngagementDocument,
} from '../controllers/engagementDocument.controller.js';
import { multerUpload } from '../middlewares/multerUpload.js';

const engagementDocumentRouter = express.Router();



engagementDocumentRouter
  .post(
    '/engagement-task/:engagementTaskId',
    multerUpload.single('document'),
    uploadEngagementDocument
  )
  .get('/:docId/download', downloadEngagementDocument)
  .delete('/:docId', deleteEngagementDocument);

export default engagementDocumentRouter;