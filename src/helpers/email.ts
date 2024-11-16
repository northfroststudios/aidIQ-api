import { Channel, ConsumeMessage } from "amqplib";
import nodemailer from "nodemailer";
import { UserRegistrationEvent } from "../types/email.types";
import { connectQueue } from "./mq";
import { config } from "../config/config";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.SMTPUserName,
    pass: config.SMTPPassword,
  },
});

async function sendVerificationEmail(data: UserRegistrationEvent) {
  const verificationUrl = `${process.env.APP_URL}/verify-email?token=${data.verificationToken}`;

  await transporter.sendMail({
    from: config.SMTPFrom,
    to: data.email,
    subject: "Verify your email address",
    html: `
      <h1>Welcome, ${data.firstName}!</h1>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>This link will expire in 5 minutes.</p>
    `,
  });
}

async function processMessage(msg: ConsumeMessage | null, channel: Channel) {
  if (!msg) return;

  try {
    const data: UserRegistrationEvent = JSON.parse(msg.content.toString());

    // Check if message is too old (e.g., > 5 minutes)
    const messageAge = Date.now() - data.timestamp;
    if (messageAge > 5 * 60 * 1000) {
      console.warn("Discarding old message:", data);
      channel.ack(msg);
      return;
    }

    await sendVerificationEmail(data);

    // Acknowledge the message only after successful processing
    channel.ack(msg);
  } catch (error) {
    console.error("Error processing message:", error);
    channel.nack(msg, false, false);
  }
}

export async function startEmailWorker() {
  try {
    const channel = await connectQueue();

    console.log("Email worker started, waiting for messages...");

    await channel.consume(
      "user-registration",
      (msg) => processMessage(msg, channel),
      {
        noAck: false, // Enable manual acknowledgment
      }
    );
  } catch (error) {
    console.error("Error starting email worker:", error);
    process.exit(1);
  }
}
