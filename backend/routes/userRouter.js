import { Router } from "express";
import { createUser } from "../controllers/userContoller.js";

const userRouter = Router(); 

userRouter
  .post('/create', createUser);

export { userRouter }