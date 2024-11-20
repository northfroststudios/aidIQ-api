import { z } from "zod";
import { TicketSchema } from "../schemas/tickets.schema";
import { ValidationError } from "../helpers/errors";
import mongoose from "mongoose";
import { Ticket } from "../models/tickets.model";

export async function CreateTeam(
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
      const ticket = await Ticket.create(
        [
          {
            ...data,
            user_id: id,
          },
        ],
        { session }
      );

      // Create the notification for the creator

      await session.commitTransaction();

      return {
        message: "Team creation successful",
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
