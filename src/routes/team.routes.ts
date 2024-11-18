import express from "express";
import { CreateTeamHandler } from "../controllers/team.controller";

const teamRouter = express.Router();

teamRouter.post("/", CreateTeamHandler);

export default teamRouter;
