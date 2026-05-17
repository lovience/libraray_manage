import mongoose from "mongoose";

export const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is missing. Create backend/.env (copy backend/.env.example) and set a valid MongoDB Atlas URI. If your DB password has special characters, URL-encode them."
    );
  }

  mongoose.set("strictQuery", true);

  const connection = await mongoose.connect(process.env.MONGODB_URI);
  console.log(`MongoDB connected: ${connection.connection.host}`);
};

