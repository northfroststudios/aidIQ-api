import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/config";

interface IUserPayload {
  id: string;
  email: string;
}
interface IDecodedPayload extends IUserPayload {
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: IUserPayload;
    }
  }
}

export default function validateUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res
      .status(401)
      .json({ error: "User is not authorized or token is missing" });
    return;
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, config.JWTSecret, (err, decoded) => {
    if (err) {
      res
        .status(401)
        .json({ error: "User is not authorized or token is missing" });
      return;
    }

    const decodedPayload = decoded as IDecodedPayload;
    req.user = {
      id: decodedPayload.id,
      email: decodedPayload.email,
    };
    next();
  });
}
