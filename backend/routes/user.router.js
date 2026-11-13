import { Router } from "express";
import {
  createStaff,
  updateUserRole,
  getMe,
  changeOwnPassword,
} from "../controllers/user.controller.js";
import { authUser, authUserAllowInactive } from "../middlewares/authUser.js";
import { requireRole } from "../middlewares/requireRole.js";

const userRouter = Router();

userRouter
  // Self-service: allowed while status is "inactive" (pending first login)
  .get("/me", authUserAllowInactive, getMe)
  .patch("/password", authUserAllowInactive, changeOwnPassword)

  // Admin only: blocked for "inactive" users by authUser
  .post("/create", authUser, requireRole("admin"), createStaff)
  .patch("/:userId/role", authUser, requireRole("admin"), updateUserRole);

export { userRouter };