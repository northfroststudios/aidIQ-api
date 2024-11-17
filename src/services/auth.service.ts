import * as bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { z } from "zod";
import { config } from "../config/config";
import { ValidationError } from "../helpers/errors";
import { getChannel } from "../helpers/mq";
import { User } from "../models/user.model";
import { Verification } from "../models/verification.model";
import {
  ForgotPasswordSchema,
  LoginSchema,
  RegisterUserSchema,
} from "../schemas/auth.schema";
import { EmailEvent } from "../types/email.types";

function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function getExpiryDate(): Date {
  return new Date(Date.now() + 5 * 60 * 1000);
}

export async function Register(data: z.infer<typeof RegisterUserSchema>) {
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
    const verificationUrl = `${process.env.APP_URL}/verify-email?token=${verificationToken}`;
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
    const event: EmailEvent = {
      email: newUser[0].email,
      subject:"Verify your email address",
      templateURL: "../../templates/verify-account.html",
      templateData: {
        Name: newUser[0].first_name,
        VerificationURL: verificationUrl,
      },
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
    console.log("RegisterUserError: ", error);
    // Only abort if the transaction hasn't been committed
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    throw new Error("unable to create account");
  }
}

export async function VerifyEmail(token: string) {
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

export async function Login(data: z.infer<typeof LoginSchema>) {
  try {
    const validationResults = LoginSchema.safeParse(data);
    if (!validationResults.success) {
      const field_errors = validationResults.error.errors.map((err) => ({
        field: err.path[0],
        message: err.message,
      }));
      throw new ValidationError(field_errors);
    }

    const { email, password } = data;

    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      throw new Error("no user exists with the provided email");
    }

    const isValidPassword = await bcrypt.compare(
      password,
      existingUser.password
    );
    if (!isValidPassword) {
      throw new Error("invalid password");
    }

    const access_token = jwt.sign(
      {
        user_id: existingUser.id,
        email: existingUser.email,
      },
      config.JWTSecret,
      {
        expiresIn: "15d",
      }
    );

    const refresh_token = jwt.sign(
      {
        user_id: existingUser.id,
        email: existingUser.email,
      },
      config.JWTSecret,
      {
        expiresIn: "30d",
      }
    );

    return {
      user: {
        id: existingUser.id,
        email: existingUser.email,
      },
      access_token,
      refresh_token,
    };
  } catch (error) {
    console.log("LoginError: ", error);

    if (error instanceof ValidationError) {
      throw error; // Rethrow validation errors with field details
    }

    if (error instanceof Error) {
      if (
        error.message === "no user exists with the provided email" ||
        error.message === "invalid password"
      ) {
        throw error;
      }
    }

    throw new Error("unable to login");
  }
}

export async function ForgotPassword(
  data: z.infer<typeof ForgotPasswordSchema>
) {
  try {
    const validationResults = ForgotPasswordSchema.safeParse(data);
    if (!validationResults.success) {
      const field_errors = validationResults.error.errors.map((err) => ({
        field: err.path[0],
        message: err.message,
      }));
      throw new ValidationError(field_errors);
    }

    const { email } = data;

    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      throw new Error("no user exists with the provided email");
    }

    const verificationToken = generateVerificationToken();
    const ResetPasswordURL = `${process.env.APP_URL}/forgot-password?email=${existingUser.email}&token=${verificationToken}`;

    const channel = getChannel();
    const event: EmailEvent = {
      email: existingUser.email,
      subject:"Reset your password",
      templateURL: "../../templates/reset-password.html",
      templateData: {
        ResetPasswordURL,
      },
      timestamp: Date.now(),
    };

    channel.sendToQueue("password-reset", Buffer.from(JSON.stringify(event)), {
      persistent: true,
    });

    return {
      message: "a reset link has been sent to your email",
    };
  } catch (error) {
    console.log(error)
    throw new Error("unable to send reset link");
  }
}
