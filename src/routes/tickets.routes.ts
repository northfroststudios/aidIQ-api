import express from "express";
import {
  CreateTicketHandler,
  GetTicketHandler,
  GetTicketsHandler,
  UpdateTicketHandler,
} from "../controllers/tickets.controller";

const ticketsRouter = express.Router();

ticketsRouter.post("/", CreateTicketHandler);
ticketsRouter.get("/all/:id", GetTicketsHandler);
ticketsRouter.put("/:id", UpdateTicketHandler);
ticketsRouter.get("/:team_id/:ticket_id", GetTicketHandler);

export default ticketsRouter;
