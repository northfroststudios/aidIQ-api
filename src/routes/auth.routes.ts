import express from "express";
import {
  LoginHandler,
  RegisterHandler,
  VerifyEmailHandler,
} from "../controllers/auth.controller";

const authRouter = express.Router();

authRouter.post("/login", LoginHandler);
authRouter.post("/register", RegisterHandler);
authRouter.post("/verify-email", VerifyEmailHandler);

export default authRouter;
