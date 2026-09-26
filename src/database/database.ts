import "dotenv/config";
import mongoose from "mongoose";

export async function connectDatabase(): Promise<void> {
  const uri = process.env.MONGO_URL ?? process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGO_URL is not configured");
  }

  await mongoose.connect(uri);

  console.log("🍃 MongoDB connected!");
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
