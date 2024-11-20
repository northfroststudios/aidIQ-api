import express from "express";
import {
  AddMemberToTeamHandler,
  CreateTeamHandler,
  DeactivateTeamMembershipHandler,
  GetTeamsHandler,
  RemoveMemberFromTeamHandler,
} from "../controllers/team.controller";

const teamRouter = express.Router();

teamRouter.get("/", GetTeamsHandler);
teamRouter.post("/", CreateTeamHandler);
teamRouter.post("/member", AddMemberToTeamHandler);
teamRouter.put("/member/status", DeactivateTeamMembershipHandler);
teamRouter.delete("/member", RemoveMemberFromTeamHandler);

export default teamRouter;
