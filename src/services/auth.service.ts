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
  EmailSchema,
  LoginSchema,
  RegisterUserSchema,
  ResetPasswordSchema,
  VerifyEmailSchema,
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
    const verificationUrl = `${process.env.APP_URL}/verify-email?email=${newUser[0].email}&token=${verificationToken}`;
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
      subject: "Verify your email address",
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
    throw new Error(error as string);
  } finally {
    await session.endSession();
  }
}

export async function VerifyEmail(data: z.infer<typeof VerifyEmailSchema>) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const validationResults = VerifyEmailSchema.safeParse(data);
    if (!validationResults.success) {
      await session.abortTransaction();
      await session.endSession();
      const field_errors = validationResults.error.errors.map((err) => ({
        field: err.path[0],
        message: err.message,
      }));
      throw new ValidationError(field_errors);
    }

    // Find the user by email
    const user = await User.findOne({ email: data.email }).session(session);
    if (!user) {
      await session.abortTransaction();
      throw new Error("User not found");
    }

    // Find the verification token
    const verification = await Verification.findOne({
      user: user._id,
      token: data.token,
      expiry: { $gt: new Date() }, // Ensure the token is not expired
    }).session(session);

    if (!verification) {
      await session.abortTransaction();
      throw new Error("Invalid or expired verification token");
    }

    // Activate the user
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { is_active: true },
      { new: true, session }
    );

    if (!updatedUser) {
      await session.abortTransaction();
      throw new Error("Failed to update user");
    }

    // Delete the verification token
    await Verification.deleteOne({ _id: verification._id }).session(session);

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    return {
      message: "Email verified successfully",
      data: { user: updatedUser },
    };
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();

    throw new Error(
      error instanceof Error ? error.message : "An unknown error occurred"
    );
  } finally {
    await session.endSession();
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
    throw new Error(error as string);
  }
}

export async function ForgotPassword(data: z.infer<typeof EmailSchema>) {
  try {
    const validationResults = EmailSchema.safeParse(data);
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
      subject: "Reset your password",
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
    console.log(error);
    throw new Error(error as string);
  }
}

export async function SendVerificationEmail(data: z.infer<typeof EmailSchema>) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const validationResults = EmailSchema.safeParse(data);
    if (!validationResults.success) {
      const field_errors = validationResults.error.errors.map((err) => ({
        field: err.path[0],
        message: err.message,
      }));
      throw new ValidationError(field_errors);
    }
    const { email } = data;

    const existingUser = await User.findOne({ email }).session(session);
    if (!existingUser) {
      throw new Error("no user exists with the provided email");
    }

    // Delete any existing verification tokens for this user
    await Verification.deleteMany({
      user: existingUser._id,
      type: "email_verification",
    }).session(session);

    const verificationToken = generateVerificationToken();
    const verificationUrl = `${process.env.APP_URL}/verify-email?email=${existingUser.email}&token=${verificationToken}`;

    // Create new verification token
    await Verification.create(
      [
        {
          user: existingUser._id,
          token: verificationToken,
          expiry: getExpiryDate(),
        },
      ],
      { session }
    );

    const channel = getChannel();
    const event: EmailEvent = {
      email: existingUser.email,
      subject: "Verify your email address",
      templateURL: "../../templates/verify-account.html",
      templateData: {
        Name: existingUser.first_name,
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

    // Commit the transaction before returning
    await session.commitTransaction();

    return {
      message: "a reset link has been sent to your email",
    };
  } catch (error) {
    console.log(error);
    throw new Error(error as string);
  } finally {
    await session.endSession();
  }
}

export async function ResetPassword(data: z.infer<typeof ResetPasswordSchema>) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Validate input data
    const validationResults = ResetPasswordSchema.safeParse(data);
    if (!validationResults.success) {
      const field_errors = validationResults.error.errors.map((err) => ({
        field: err.path[0],
        message: err.message,
      }));
      throw new ValidationError(field_errors);
    }

    const { email, password, token } = data;

    // Find user and verify token in a single query
    const existingUser = await User.findOne({
      email,
    }).session(session);

    if (!existingUser) {
      throw new Error("user does not exist");
    }

    const verification = await Verification.findOne({
      user: existingUser._id,
      token,
      expiry: { $gt: new Date() }, // Ensure the token is not expired
    }).session(session);

    if (!verification) {
      throw new Error("Invalid or expired verification token");
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user document
    existingUser.password = hashedPassword;
    await existingUser.save({ session });

    // Commit transaction
    await session.commitTransaction();

    return {
      success: true,
      message: "Password has been reset successfully",
    };
  } catch (error) {
    // Rollback transaction on error
    await session.abortTransaction();

    // Log unexpected errors and throw a generic error
    console.error("Password reset error:", error);
    throw new Error(error as string);
  } finally {
    // Always end the session
    await session.endSession();
  }
}
