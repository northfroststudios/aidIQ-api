import * as bcrypt from "bcrypt";
import crypto from "crypto";
import mongoose from "mongoose";
import { z } from "zod";
import { ValidationError } from "../helpers/errors";
import { getChannel } from "../helpers/mq";
import { User } from "../models/user.model";
import { Verification } from "../models/verification.model";
import { RegisterUserSchema } from "../schemas/auth.schema";
import { IAPIResponse } from "../types/api.types";
import { UserRegistrationEvent } from "../types/email.types";

function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function getExpiryDate(): Date {
  return new Date(Date.now() + 5 * 60 * 1000);
}

export async function Register(
  data: z.infer<typeof RegisterUserSchema>
): Promise<IAPIResponse> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const validationResults = RegisterUserSchema.safeParse(data);
    if (!validationResults.success) {
      await session.abortTransaction();
      await session.endSession();
      const field_errors = validationResults.error.errors.map((err) => ({
        field: err.path[0],
        message: err.message,
      }));
      throw new ValidationError(field_errors);
    }

    const { email, first_name, last_name, password } = data;

    // Check if user exists
    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) {
      await session.abortTransaction();
      await session.endSession();
      throw new Error("a user exists with the provided email");
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create(
      [
        {
          first_name,
          last_name,
          email,
          password: hashedPassword,
          is_active: false,
        },
      ],
      { session }
    );

    // Create verification token
    const verificationToken = generateVerificationToken();
    await Verification.create(
      [
        {
          user: newUser[0]._id,
          token: verificationToken,
          expiry: getExpiryDate(),
        },
      ],
      { session }
    );

    // Commit the transaction before sending the event
    await session.commitTransaction();
    await session.endSession();

    // Send verification email after successful commit
    const channel = getChannel();
    const event: UserRegistrationEvent = {
      email: newUser[0].email,
      firstName: newUser[0].first_name,
      verificationToken,
      timestamp: Date.now(),
    };

    channel.sendToQueue(
      "user-registration",
      Buffer.from(JSON.stringify(event)),
      {
        persistent: true,
      }
    );

    return {
      message: "account creation successful",
      data: {
        id: newUser[0]._id,
        email: newUser[0].email,
        first_name: newUser[0].first_name,
        last_name: newUser[0].last_name,
        is_active: newUser[0].is_active,
      },
    };
  } catch (error) {
    // Only abort if the transaction hasn't been committed
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    console.error("Registration error:", error);
    throw new Error("there was an error on the server. Please try again");
  }
}

export async function VerifyEmail(token: string): Promise<IAPIResponse> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const verification = await Verification.findOne({
      token,
      expiry: { $gt: new Date() },
    }).session(session);

    if (!verification) {
      await session.abortTransaction();
      await session.endSession();
      throw new Error("Invalid or expired verification token");
    }

    const user = await User.findByIdAndUpdate(
      verification.user,
      { is_active: true },
      { new: true, session }
    );

    if (!user) {
      await session.abortTransaction();
      await session.endSession();
      throw new Error("User not found");
    }

    await Verification.deleteOne({ _id: verification._id }).session(session);
    await session.commitTransaction();
    await session.endSession();

    return {
      message: "Email verified successfully",
      data: {},
    };
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();

    console.error("Verification error:", error);
    throw new Error("there was an error on the server. Please try again");
  }
}
