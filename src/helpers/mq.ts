import amqp, { Channel, Connection } from "amqplib";
import { config } from "../config/config";

let channel: Channel;
let connection: Connection;

export async function connectQueue() {
  const connectionString = `amqp://${config.RabbitMQUser}:${config.RabbitMQPassword}@localhost:5672/`;
  try {
    connection = await amqp.connect(
      connectionString || "amqp://rmq:password@localhost:5672/"
    );
    channel = await connection.createChannel();

    // Ensure the queue exists
    await channel.assertQueue("user-registration", {
      durable: true, // Queue survives broker restart
    });

    console.log("Connected to RabbitMQ");
    return channel;
  } catch (error) {
    console.error("RabbitMQ connection error:", error);
    throw error;
  }
}

export function getChannel(): Channel {
  if (!channel) throw new Error("RabbitMQ channel not initialized");
  return channel;
}

export async function closeConnection() {
  try {
    await channel?.close();
    await connection?.close();
  } catch (error) {
    console.error("Error closing RabbitMQ connection:", error);
  }
}
