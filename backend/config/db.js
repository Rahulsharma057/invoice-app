const mongoose = require("mongoose");

mongoose.set("strictQuery", true);

const connectDB = async () => {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/invoice_app";

  mongoose.connection.on("connected", () => {
    console.log(`[db] MongoDB connected -> ${mongoose.connection.name}`);
  });
  mongoose.connection.on("error", (err) => {
    console.error("[db] MongoDB connection error:", err.message);
  });
  mongoose.connection.on("disconnected", () => {
    console.warn("[db] MongoDB disconnected");
  });

  // Fail fast in dev, but don't crash the whole process in prod on a transient blip.
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 8000,
  });
};

module.exports = connectDB;
