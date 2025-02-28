import { NextFunction, Request, Response } from "express";
import {
  ForgotPassword,
  Login,
  Register,
  ResetPassword,
  SendVerificationEmail,
  VerifyEmail,
} from "../services/auth.service";

async function RegisterHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await Register(req.body);
    res.status(201).json(data);
  } catch (error) {
    // pass the error to the error handler middleware
    next(error);
  }
}

async function VerifyEmailHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await VerifyEmail(req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

async function LoginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await Login(req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

async function ForgotPasswordHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await ForgotPassword(req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

async function SendVerificationEmailHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await SendVerificationEmail(req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

async function ResetPasswordHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await ResetPassword(req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

export {
  RegisterHandler,
  VerifyEmailHandler,
  LoginHandler,
  ForgotPasswordHandler,
  SendVerificationEmailHandler,
  ResetPasswordHandler,
};
