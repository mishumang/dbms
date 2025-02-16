import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bodyParser from "body-parser"; // Middleware for parsing JSON & URL-encoded data

// Import routes
import inventoryRoutes from "./routes/inventory.js";
import analyticsRoutes from "./routes/analytics.js";
import predictionRoutes from "./routes/predictions.js";
import userRoutes from "./routes/user.js";
import mailRoutes from "./routes/email.js";
import ocrRoutes from "./routes/ocr.js";

dotenv.config(); // Load environment variables from .env

const app = express();

// ✅ Enable CORS (allow cross-origin requests)
app.use(cors());

// ✅ Middleware: Parse JSON and URL-encoded data (increased size limit)
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// ✅ Routes Setup
app.use("/api/ocr", ocrRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/predictions", predictionRoutes);
app.use("/api/user", userRoutes);
app.use("/api/mail", mailRoutes);

// ✅ Set up MongoDB Connection
const PORT = process.env.PORT || 5000;
const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/inventory_db";

mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("[MongoDB] Connected Successfully!");
    // ✅ Start the Express server only after MongoDB is connected
    app.listen(PORT, () => console.log(`[Server] Running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("[MongoDB ERROR]", err);
    process.exit(1); // Exit the server if MongoDB connection fails
  });
