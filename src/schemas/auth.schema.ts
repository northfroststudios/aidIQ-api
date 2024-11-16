import { z } from "zod";

export const RegisterUserSchema = z.object({
  first_name: z
    .string()
    .min(1, { message: "First Name must be at least 2 characters" })
    .max(32, { message: "First Name must not be more than 32 characters" }),
  last_name: z
    .string()
    .min(1, { message: "Last Name must be at least 2 characters" })
    .max(32, { message: "Last Name must not be more than 32 characters" }),
  email: z.string().email({ message: "Enter a valid email" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .max(32, { message: "Password must not exceed 32 characters" })
    .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$/, {
      message:
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    }),
});
