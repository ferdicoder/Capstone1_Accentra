import { Router } from 'express';
import{
  createReq,
  approveReq,
  // createEng,
  defReq
} from '../controllers/requestControllers.js'

const mockRouter = Router(); 

export default 
  mockRouter.post('/createReq', createReq)
  .post('/approveReq', approveReq)
  // .post('/createEng', createEng)
  .post('/defReq', defReq)
