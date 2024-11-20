import { Document, Schema, Types, model } from "mongoose";

interface ITicket extends Document {
  title: string;
  description: string;
  user_id: Types.ObjectId;
  team_id: Types.ObjectId;
  status?: "open" | "in-progress" | "resolved" | "closed";
  priority?: "low" | "medium" | "high";
  created_at?: Date;
  updated_at?: Date;
}

// Define the schema
const ticketSchema = new Schema<ITicket>(
  {
    title: {
      type: String,
      required: true,
      trim: true, // Trim unnecessary whitespace
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "in-progress", "resolved", "closed"],
      default: "open",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    team_id: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

const Ticket = model<ITicket>("Ticket", ticketSchema);

export { ITicket, Ticket };
