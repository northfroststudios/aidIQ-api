import express from "express";
import authRouter from "./auth.routes";

export const router = express.Router();

// Auth Routes
const v1 = router.use("/auth", authRouter);


export default v1