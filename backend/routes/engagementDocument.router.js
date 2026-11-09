import express from 'express';
import {
  getEngagementDeliverables,
  uploadEngagementDeliverable,
  downloadEngagementDeliverable,
  deleteEngagementDeliverable,
  uploadEngagementDocument,
  downloadEngagementDocument,
  deleteEngagementDocument,
  uploadEngagementTaskReference,
  downloadEngagementTaskReference,
  deleteEngagementTaskReference,
  copyTemplateReferencesToEngagement,
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
  .delete(
    '/deliverables/:deliverableId',
    authUser,
    requireRole('admin', 'staff'),
    deleteEngagementDeliverable
  )
  // Fills a freshly created engagement's task guides from the service
  // template — the create_engagement RPCs copy task rows but not files.
  .post(
    '/engagement/:engagementId/template-references',
    authUser,
    requireRole('admin', 'staff'),
    copyTemplateReferencesToEngagement
  )
  // Firm-provided reference files for engagement tasks — registered before the
  // generic /:docId routes so "reference" never gets treated as a doc id.
  .post(
    '/engagement-task/:engagementTaskId/reference',
    authUser,
    requireRole('admin', 'staff'),
    multerUpload.single('document'),
    uploadEngagementTaskReference
  )
  .get('/reference/:docId/download', downloadEngagementTaskReference)
  .delete('/reference/:docId', authUser, requireRole('admin', 'staff'), deleteEngagementTaskReference)
  .post(
    '/engagement-task/:engagementTaskId',
    authUser,
    multerUpload.single('document'),
    uploadEngagementDocument
  )
  .get('/:docId/download', downloadEngagementDocument)
  .delete('/:docId', authUser, deleteEngagementDocument);

export default engagementDocumentRouter;