import { z } from "zod";
import { TicketSchema } from "../schemas/tickets.schema";
import { NotFoundError, ValidationError } from "../helpers/errors";
import mongoose from "mongoose";
import { Ticket } from "../models/tickets.model";
import { Membership } from "../models/membership.model";

export async function CreateTicket(
  data: z.infer<typeof TicketSchema>,
  id: string
) {
  try {
    const validationResults = TicketSchema.safeParse(data);
    if (!validationResults.success) {
      const fieldErrors = validationResults.error.errors.map((err) => ({
        field: err.path[0],
        message: err.message,
      }));
      throw new ValidationError(fieldErrors);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // i want to send a batch email to all staff of that team, when a ticket is created
      const memberships = await Membership.find({
        team_id: data.team_id,
      });

      const staff = memberships.filter(
        (membership) => membership.role !== "customer"
      );

      const ticket = await Ticket.create(
        [
          {
            ...data,
            user_id: id,
          },
        ],
        { session }
      );

      await session.commitTransaction();

      return {
        message: "Ticket creation successful",
        data: {
          ticket_id: ticket[0]._id,
          title: ticket[0].title,
        },
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error(error);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new Error(`Unexpected error: ${error}`);
  }
}

export async function GetTickets(team_id: string) {
  try {
    const tickets = await Ticket.find({
      team_id,
    });
    return {
      message: "Tickets fetched successfully",
      data: tickets.map((ticket) => ({
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        team_id: ticket.team_id,
        user_id: ticket.user_id,
      })),
    };
  } catch (error) {
    console.error("Error fetching tickets:", error);
    throw new Error(error as string);
  }
}

interface GetTicketProps {
  team_id: string;
  ticket_id: string;
}
export async function GetTicket(user_id: string,{team_id,ticket_id}:GetTicketProps) {
    console.log("team_id",team_id)
    console.log("ticket_id",ticket_id)
  try {
    const membership = await Membership.findOne({
      user_id,
      team_id,
    });
    if (!membership) {
      throw new Error("User is not a member of the team");
    }
    const ticket = await Ticket.findOne({
      _id: ticket_id,
      team_id,
    });

    // if (membership.team_id !== ticket?.team_id) {
    //   throw new Error("Ticket does not belong to the team");
    // }

    if (!ticket) {
      throw new NotFoundError("Ticket does not exist");
    }
    return {
      message: "Ticket fetched successfully",
      data: ticket,
    };
  } catch (error) {
    console.error("Error fetching tickets:", error);
    throw new Error(error as string);
  }
}

interface UpdateTicketParams {
  ticket_id: string;
  title?: string;
  description?: string;
  status?: "open" | "in-progress" | "resolved" | "closed";
  priority?: "low" | "medium" | "high";
}

export async function UpdateTicket({
  ticket_id,
  title,
  description,
  status,
  priority,
}: UpdateTicketParams) {
  try {
    // Find the ticket by ID
    const ticket = await Ticket.findOne({ _id: ticket_id });

    if (!ticket) {
      throw new NotFoundError("Ticket not found");
    }

    if (title) ticket.title = title;
    if (description) ticket.description = description;
    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;

    // Save the updated ticket
    await ticket.save();

    return {
      message: "Ticket updated successfully",
      ticket, // Return the updated ticket for feedback
    };
  } catch (error: unknown) {
    console.error("Error updating ticket:", error);
    throw new Error(
      error instanceof Error ? error.message : "An unknown error occurred"
    );
  }
}
