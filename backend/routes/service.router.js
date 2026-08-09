import { Router } from "express";
import { createService } from "../controllers/service.controller.js";

const serviceRouter = Router(); 

serviceRouter
  .post('/create', createService);

export { serviceRouter } 