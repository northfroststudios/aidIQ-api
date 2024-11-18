import { z } from "zod";

export const TeamSchema = z.object({
  name: z.string(),
});
