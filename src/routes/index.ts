import express from "express";
import authRouter from "./auth.routes";
import teamRouter from "./team.routes";
import validateUser from "../middleware/auth.middleware";
import ticketsRouter from "./tickets.routes";

export const v1 = express.Router();

// Auth Routes
v1.use("/auth", authRouter);
v1.use("/teams", validateUser, teamRouter);
v1.use("/tickets", validateUser, ticketsRouter);

export default v1;
