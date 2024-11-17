import amqp, { Channel, Connection } from "amqplib";
import { config } from "../config/config";
import { QUEUES } from "./queues";

let channel: Channel;
let connection: Connection;

// This function connects to the RabbitMQ Server, and creates all the queues the app needs.
export async function connectQueue() {
  const connectionString = `amqp://${config.RabbitMQUser}:${config.RabbitMQPassword}@localhost:5672/`;
  try {
    connection = await amqp.connect(
      connectionString || "amqp://rmq:password@localhost:5672/"
    );
    channel = await connection.createChannel();

    // Ensure that all queue exists
    // Object.entries() is a method that returns an array of key-value pairs from an object.
    // Object.entries(QUEUES) is :
    // [
    //   ["email", [{ name: "user-registration", ... }, { name: "password-reset", ... }]],
    //   ["notifications", [{ name: "user-notifications", ... }]]
    // ]
    for (const [_, queues] of Object.entries(QUEUES)) {
      for (const queue of queues) {
        try {
          await channel.assertQueue(queue.name, {
            durable: true,
          });
        } catch (error) {
          console.error(`Error asserting queue ${queue.name}:`, error);
          throw error;
        }
      }
    }

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
