import express from "express";
import {
  CreateTeamHandler,
  GetTeamsHandler,
} from "../controllers/team.controller";

const teamRouter = express.Router();

teamRouter.get("/", GetTeamsHandler);
teamRouter.post("/", CreateTeamHandler);

export default teamRouter;
