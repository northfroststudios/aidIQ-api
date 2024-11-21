import { NextFunction, Request, Response } from "express";
import {
  CreateTicket,
  GetTicket,
  GetTickets,
  UpdateTicket,
} from "../services/tickets.service";

async function CreateTicketHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await CreateTicket(req.body, req.user?.id!);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}
async function GetTicketsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await GetTickets(req.params.id);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}
async function GetTicketHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await GetTicket(req.user?.id!, {
      team_id:req.params.team_id,
      ticket_id: req.params.ticket_id,
    });
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}
async function UpdateTicketHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await UpdateTicket({ ...req.body, ticket_id: req.params.id });
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

export {
  CreateTicketHandler,
  GetTicketsHandler,
  UpdateTicketHandler,
  GetTicketHandler,
};
