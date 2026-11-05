import express from 'express';
import { downloadPaymentProof, submitPayment } from '../controllers/payment.controller.js';
import { multerUpload } from '../middlewares/multerUpload.js';

const paymentRouter = express.Router();

paymentRouter
  .post('/:billingId', multerUpload.single('document'), submitPayment)
  .get('/:paymentId/proof', downloadPaymentProof);

export default paymentRouter;
