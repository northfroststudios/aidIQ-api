import { Channel } from "amqplib";
import { connectQueue } from "../mq";
import { ProcessEmail } from "./email";
import { EMAIL_QUEUES } from "./email.queues";

export async function startEmailWorker() {
  try {
    const channel = await connectQueue();

    // Create a prefetch limit to control concurrency
    await channel.prefetch(1);

    console.log("Email worker started, waiting for messages...");

    // Start consuming from all email queues
    const consumePromises = EMAIL_QUEUES.map(async (queue) => {
      try {
        await channel.consume(
          queue.name,
          (msg) => ProcessEmail(msg, channel),
          {
            noAck: false, // Enable manual acknowledgment
          }
        );
      } catch (error) {
        console.error(`Error setting up consumer for queue ${queue.name}:`, error);
        throw error;
      }
    });

    await Promise.all(consumePromises);

    // Handle process termination
    setupGracefulShutdown(channel);

  } catch (error) {
    console.error("Error starting email worker:", error);
    process.exit(1);
  }
}

function setupGracefulShutdown(channel: Channel) {
  const shutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}. Closing channel and exiting...`);
    try {
      await channel.close();
      process.exit(0);
    } catch (error) {
      console.error("Error during shutdown:", error);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}
