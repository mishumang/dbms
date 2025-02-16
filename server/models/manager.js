import mongoose from "mongoose";

const ManagerSchema = new mongoose.Schema({
  extractedText: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
});

const Manager = mongoose.model("Manager", ManagerSchema);

export default Manager;
