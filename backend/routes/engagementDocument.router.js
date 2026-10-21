import express from 'express';
import {
  getEngagementDeliverables,
  uploadEngagementDeliverable,
  downloadEngagementDeliverable,
  uploadEngagementDocument,
  downloadEngagementDocument,
  deleteEngagementDocument,
} from '../controllers/engagementDocument.controller.js';
import { multerUpload } from '../middlewares/multerUpload.js';
import { authUser } from '../middlewares/authUser.js';
import { requireRole } from '../middlewares/requireRole.js';

const engagementDocumentRouter = express.Router();



engagementDocumentRouter
  .get('/engagement/:engagementId/deliverables', authUser, getEngagementDeliverables)
  .post(
    '/engagement/:engagementId/deliverables',
    authUser,
    requireRole('admin', 'staff'),
    multerUpload.single('document'),
    uploadEngagementDeliverable
  )
  .get('/deliverables/:deliverableId/download', downloadEngagementDeliverable)
  .post(
    '/engagement-task/:engagementTaskId',
    multerUpload.single('document'),
    uploadEngagementDocument
  )
  .get('/:docId/download', downloadEngagementDocument)
  .delete('/:docId', deleteEngagementDocument);

export default engagementDocumentRouter;