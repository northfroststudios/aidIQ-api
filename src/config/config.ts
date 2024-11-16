import dotenv from "dotenv";

// Load the .env file contents into process.env:
dotenv.config();

export const config = {
  ConnectionString: process.env.CONNECTION_STRING || "",
  JWTSecret: process.env.JWT_SECRET || "fallback_secret",
  ServerPort: process.env.PORT || 3000,
  FrontendURL: process.env.FRONTEND_URL || "http://localhost:3000",
  SMTPUserName: process.env.SMTP_USERNAME || "",
  SMTPPassword: process.env.SMTP_PASSWORD || "",
  SMTPHost: process.env.SMTP_HOST || "",
  SMTPPort: parseInt(process.env.SMTP_PORT || "587"),
  SMTPSecure: process.env.SMTP_SECURE === "true",
  SMTPFrom: process.env.SMTP_FROM || "noreply@example.com",
  RabbitMQUser: process.env.RABBITMQ_USER || "guest",
  RabbitMQPassword: process.env.RABBITMQ_PASSWORD || "guest",
};

// Add validation to ensure required values exist
const requiredEnvVars = [
  "CONNECTION_STRING",
  "JWT_SECRET",
  "SMTP_USERNAME",
  "SMTP_PASSWORD",
  "SMTP_HOST",
  "RABBITMQ_USER",
  "RABBITMQ_PASSWORD",
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
