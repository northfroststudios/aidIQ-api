import express from "express";
import {
  RegisterHandler,
  VerifyEmailHandler,
} from "../controllers/auth.controller";

const authRouter = express.Router();

authRouter.post("/register", RegisterHandler);
authRouter.post("/verify-email", VerifyEmailHandler);

export default authRouter;
