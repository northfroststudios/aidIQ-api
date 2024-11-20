import { z } from "zod";
import { TeamSchema } from "../schemas/teams.schema";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../helpers/errors";
import { Team } from "../models/team.model";
import mongoose from "mongoose";
import { Membership } from "../models/membership.model";
import { User } from "../models/user.model";

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

    // Using a session to ensure both operations succeed or fail together
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create the team
      const team = await Team.create(
        [
          {
            name,
            user_id: id,
          },
        ],
        { session }
      );

      // Create the membership for the creator
      await Membership.create(
        [
          {
            user_id: id,
            team_id: team[0]._id,
            role: "creator",
            is_active: true,
          },
        ],
        { session }
      );

      await session.commitTransaction();

      return {
        message: "team creation successful",
        data: {
          id: team[0]._id,
          name: team[0].name,
        },
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.log(error);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new Error(error as string);
  }
}

export async function GetTeams(id: string) {
  try {
    const teams = await Team.find({
      user_id: id,
    });
    return {
      message: "Teams fetched successfully",
      data: teams.map((team) => ({
        id: team.id,
        name: team.name,
      })),
    };
  } catch (error) {
    console.error("Error fetching teams:", error);
    throw new Error(error as string);
  }
}

interface AddMemberInput {
  user_id: string;
  team_id: string;
  role: "admin" | "staff" | "customer";
}
export async function AddMemberToTeam(data: AddMemberInput) {
  try {
    // Check if team exists
    const team = await Team.findById(data.team_id);
    if (!team) {
      throw new NotFoundError("Team not found");
    }

    // Check if user exists
    const user = await User.findById(data.user_id);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Check if membership already exists
    const existingMembership = await Membership.findOne({
      user_id: data.user_id,
      team_id: data.team_id,
    });

    if (existingMembership) {
      if (existingMembership.is_active) {
        throw new ConflictError("User is already a member of this team");
      } else {
        // Reactivate membership if it exists but is inactive
        existingMembership.is_active = true;
        existingMembership.role = data.role;
        await existingMembership.save();

        return {
          message: "membership reactivated successfully",
          data: {
            user_id: existingMembership.user_id,
            team_id: existingMembership.team_id,
            role: existingMembership.role,
          },
        };
      }
    }

    // Create new membership
    const membership = await Membership.create({
      user_id: data.user_id,
      team_id: data.team_id,
      role: data.role,
      is_active: true,
    });

    return {
      message: "member added successfully",
      data: {
        user_id: membership.user_id,
        team_id: membership.team_id,
        role: membership.role,
      },
    };
  } catch (error) {
    console.log(error);
    if (error instanceof NotFoundError || error instanceof ConflictError) {
      throw error;
    }
    throw new Error(error as string);
  }
}

interface RemoveMemberInput {
  user_id: string;
  team_id: string;
}
export async function RemoveMemberFromTeam(data: RemoveMemberInput) {
  try {
    // Find the membership first to check if it exists and validate role
    const membership = await Membership.findOne({
      user_id: data.user_id,
      team_id: data.team_id,
    });

    if (!membership) {
      throw new NotFoundError("Membership not found");
    }

    // Don't allow deletion of team creator's membership
    if (membership.role === "creator") {
      throw new ForbiddenError("Team creator's membership cannot be deleted");
    }

    // Delete the membership
    await Membership.deleteOne({
      user_id: data.user_id,
      team_id: data.team_id,
    });

    return {
      message: "membership deleted successfully",
      data: {
        user_id: data.user_id,
        team_id: data.team_id,
      },
    };
  } catch (error) {
    console.log(error);
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      throw error;
    }
    throw new Error(error as string);
  }
}

interface DeactivateMembershipInput {
  user_id: string;
  team_id: string;
}

export async function DeactivateTeamMembership(
  data: DeactivateMembershipInput
) {
  try {
    // Find the membership
    const membership = await Membership.findOne({
      user_id: data.user_id,
      team_id: data.team_id,
      is_active: true,
    });

    if (!membership) {
      throw new NotFoundError("Active membership not found");
    }

    // Don't allow deactivation of team creator's membership
    if (membership.role === "creator") {
      throw new ForbiddenError(
        "Team creator's membership cannot be deactivated"
      );
    }

    // Deactivate the membership
    membership.is_active = false;
    await membership.save();

    return {
      message: "membership deactivated successfully",
      data: {
        user_id: data.user_id,
        team_id: data.team_id,
        role: membership.role,
        is_active: false,
      },
    };
  } catch (error) {
    console.log(error);
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      throw error;
    }
    throw new Error(error as string);
  }
}
