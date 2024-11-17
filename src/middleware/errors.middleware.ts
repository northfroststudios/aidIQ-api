import { NextFunction, Request, Response } from "express";
import { ValidationError } from "../helpers/errors";

export default function errorHandler(
  err: Error | ValidationError,
  req: Request,
  res: Response,
  next: NextFunction
) {

  res.status(err instanceof ValidationError ? 422 : 400).json({
    error: err.message,
  });
}
