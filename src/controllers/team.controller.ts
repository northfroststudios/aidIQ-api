import { NextFunction, Request, Response } from "express";
import { CreateTeam } from "../services/team.service";

async function CreateTeamHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await CreateTeam(req.body, req.user?.id!);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

export { CreateTeamHandler };
