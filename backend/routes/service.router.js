import { Router } from "express";
import {
  createService,
  deleteService,
  getServiceTemplateTasks,
} from "../controllers/service.controller.js";
import { authUser } from "../middlewares/authUser.js";
import { requireRole } from "../middlewares/requireRole.js";

const serviceRouter = Router(); 

serviceRouter
  .get('/:serviceId/template-tasks', authUser, requireRole("admin", "staff"), getServiceTemplateTasks)
  .post('/create', authUser, requireRole("admin"), createService)
  .delete('/:id', authUser, requireRole("admin"), deleteService);

export { serviceRouter } 