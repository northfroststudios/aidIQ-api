import { NextFunction, Request, Response } from "express";
import { Register } from "../services/auth.service";
import { IAPIResponse } from "../types/api.types";

async function RegisterHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await Register(req.body);
    res.status(201).json(data);
  } catch (error) {
    const data: IAPIResponse = {
      message:"unsuccessful request",
      data:error
    };
    res.status(500).json(data);
    next(error);
  }
}

export { RegisterHandler };
