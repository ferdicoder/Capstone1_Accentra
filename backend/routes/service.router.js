import { Router } from "express";
import { createService } from "../controllers/service.controller.js";
import { authUser } from "../middlewares/authUser.js";
import { requireRole } from "../middlewares/requireRole.js";

const serviceRouter = Router(); 

serviceRouter
  .post('/create', authUser, requireRole("admin"), createService);

export { serviceRouter } 