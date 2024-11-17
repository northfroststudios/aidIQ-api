import express from "express";
import morgan from "morgan";
import { config } from "./config/config";
import ConnectToDB from "./db/db";
import v1 from "./routes";
import errorHandler from "./middleware/errors.middleware";
import { startEmailWorker } from "./helpers/email/email.worker";

const app = express();

async function startServer() {
  try {
    ConnectToDB();

    // By calling express.json(), Express can automatically parse JSON data from the request body and convert it to a JavaScript object, making it accessible through req.body.
    app.use(express.json());
    // Enables your Express app to parse URL-encoded form data sent in the body of a request, typically from HTML forms.
    app.use(express.urlencoded({ extended: true }));
    // Use the morgan middleware for request logging
    app.use(morgan("dev"));
    app.use("/api/v1", v1);

    app.get("/", (_, res) => {
      res.send("Welcome to the AidIQ API!🚀");
    });

    // Use this middleware to handle errors
    // You define error-handling middleware last, after other app.use()
    app.use(errorHandler);

    // Initialize RabbitMQ
    await startEmailWorker();

    app.listen(config.ServerPort, () => {
      console.log(`Server is running at http://localhost:${config.ServerPort}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
