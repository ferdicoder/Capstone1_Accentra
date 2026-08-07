import { Router } from "express";
import { createStaff } from "../controllers/user.controller.js";

const userRouter = Router(); 

userRouter
  .post('/create', createStaff);

export { userRouter }