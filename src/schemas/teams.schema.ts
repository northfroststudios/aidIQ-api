import { z } from "zod";

export const TeamSchema = z.object({
  name: z.string({message:"Enter a valid team name"}),
});
