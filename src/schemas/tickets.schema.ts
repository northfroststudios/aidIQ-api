import { z } from "zod";

export const TicketSchema = z.object({
  title: z
    .string({ message: "Enter a valid title" })
    .min(1, "Title is required"),
  description: z
    .string({ message: "Enter a valid description" })
    .min(1, "Description is required"),
  user_id: z.string({ message: "User ID is required" }),
  team_id: z.string({ message: "Team ID is required" }),
  status: z
    .enum(["open", "in-progress", "resolved", "closed"], {
      message: "Invalid status value",
    })
    .optional()
    .default("open"),
  priority: z
    .enum(["low", "medium", "high"], {
      message: "Invalid priority value",
    })
    .optional()
    .default("medium"),
});
