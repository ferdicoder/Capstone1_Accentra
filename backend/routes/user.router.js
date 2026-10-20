import { Router } from "express";
import { createStaff, updateUserRole } from "../controllers/user.controller.js";
import { authUser } from "../middlewares/authUser.js";
import { requireRole } from "../middlewares/requireRole.js";

const userRouter = Router(); 

userRouter
  .post('/create', createStaff)
  .patch('/:userId/role', authUser, requireRole("admin"), updateUserRole);

export { userRouter }