import { Channel, ConsumeMessage } from "amqplib";
import fs from "fs";
import * as Handlebars from "handlebars";
import nodemailer from "nodemailer";
import path from "path";
import { config } from "../../config/config";
import { connectQueue } from "../mq";
import { EmailEvent } from "../../types/email.types";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.SMTPUserName,
    pass: config.SMTPPassword,
  },
});

// use this function to compile the email templates, so that they can used when sending
export function CompileEmailTemplate(tPath: string, data: any) {
  const templatePath = path.resolve(__dirname, tPath);
  const templateSource = fs.readFileSync(templatePath, "utf8");
  const template = Handlebars.compile(templateSource);
  const html = template(data);
  return html;
}

export async function SendEmail(data: EmailEvent) {
  await transporter.sendMail({
    from: config.SMTPFrom,
    to: data.email,
    subject: data.subject,
    html: CompileEmailTemplate(data.templateURL, data.templateData),
  });
}

// this function runs when a message is sent to the message queue
export async function ProcessEmail(msg: ConsumeMessage | null, channel: Channel) {
  if (!msg) return;

  try {
    const data: EmailEvent = JSON.parse(msg.content.toString());

    // Check if message is too old (e.g., > 5 minutes)
    const messageAge = Date.now() - data.timestamp;
    if (messageAge > 5 * 60 * 1000) {
      console.warn("Discarding old message:", data);
      channel.ack(msg);
      return;
    }

    await SendEmail(data);

    // Acknowledge the message only after successful processing
    channel.ack(msg);
  } catch (error) {
    console.error("Error processing message:", error);
    channel.nack(msg, false, false);
  }
}
