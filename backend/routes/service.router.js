import { Router } from "express";
import { createService, deleteService } from "../controllers/service.controller.js";
import { authUser } from "../middlewares/authUser.js";
import { requireRole } from "../middlewares/requireRole.js";

const serviceRouter = Router(); 

serviceRouter
  .post('/create', authUser, requireRole("admin"), createService)
  .delete('/:id', authUser, requireRole("admin"), deleteService);

export { serviceRouter } 