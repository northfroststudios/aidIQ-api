import express from "express";
import { RegisterHandler } from "../controllers/auth.controller";

const authRouter = express.Router();

authRouter.post("/register", RegisterHandler);

export default authRouter;
