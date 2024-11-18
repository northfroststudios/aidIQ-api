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

export async function GetTeams(id: string) {
  try {
    // Fetch teams for the given user_id
    const teams = await Team.find({
      user_id: id,
    });

    // Return the fetched teams
    return {
      message: "Teams fetched successfully",
      data: teams.map(team => ({
        id: team.id,
        name: team.name,
      })),
    };
  } catch (error) {
    console.error("Error fetching teams:", error);
    throw new Error(error as string);
  }
}