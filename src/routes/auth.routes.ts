import express from "express";
import {
  ForgotPasswordHandler,
  LoginHandler,
  RegisterHandler,
  ResetPasswordHandler,
  SendVerificationEmailHandler,
  VerifyEmailHandler,
} from "../controllers/auth.controller";

const authRouter = express.Router();

authRouter.post("/login", LoginHandler);
authRouter.post("/register", RegisterHandler);
authRouter.post("/verify-email", VerifyEmailHandler);
authRouter.post("/forgot-password", ForgotPasswordHandler);
authRouter.post("/reset-password", ResetPasswordHandler);
authRouter.post("/resend-verification", SendVerificationEmailHandler);

export default authRouter;
