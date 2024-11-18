import { NextFunction, Request, Response } from "express";
import { CreateTeam, GetTeams } from "../services/team.service";

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
async function GetTeamsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await GetTeams(req.user?.id!);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

export { CreateTeamHandler,GetTeamsHandler };
