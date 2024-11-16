import mongoose from "mongoose";
import { config } from "../config/config";

export default async function ConnectToDB() {
  const connectionString = config.ConnectionString;

  if (!connectionString) {
    throw new Error("CONNECTION_STRING is not defined");
  }

  try {
    const connect = await mongoose.connect(connectionString);
    console.log(
      "Successfully connected to Database",
      connect.connection.host,
      connect.connection.name
    );
  } catch (err) {
    console.log(err);
    process.exit;
  }
}
