import { z } from "zod";
import { TeamSchema } from "../schemas/teams.schema";
import { ValidationError } from "../helpers/errors";
import { Team } from "../models/team.model";

export async function CreateTeam(data: z.infer<typeof TeamSchema>, id: string) {
  try {
    const validationResults = TeamSchema.safeParse(data);
    if (!validationResults.success) {
      const field_errors = validationResults.error.errors.map((err) => ({
        field: err.path[0],
        message: err.message,
      }));
      throw new ValidationError(field_errors);
    }

    const { name } = data;
    const team = await Team.create({
      name,
      user_id: id,
    });
    return {
      message: "team creation successful",
      data: {
        id,
        name: team.name,
      },
    };
  } catch (error) {
    console.log(error)
    throw new Error(error as string);
  }
}
