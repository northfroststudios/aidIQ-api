import { NextFunction, Request, Response } from "express";
import {
  AddMemberToTeam,
  CreateTeam,
  DeactivateTeamMembership,
  GetTeams,
  RemoveMemberFromTeam,
} from "../services/team.service";

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
async function AddMemberToTeamHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await AddMemberToTeam(req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}
async function DeactivateTeamMembershipHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await DeactivateTeamMembership(req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}
async function RemoveMemberFromTeamHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await RemoveMemberFromTeam(req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

export {
  CreateTeamHandler,
  GetTeamsHandler,
  AddMemberToTeamHandler,
  RemoveMemberFromTeamHandler,
  DeactivateTeamMembershipHandler,
};
