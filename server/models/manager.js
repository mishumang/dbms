import mongoose from "mongoose";

const ManagerSchema = new mongoose.Schema({
  managerId: { type: String, required: true },
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true },
});

const Manager = mongoose.model("Manager", ManagerSchema);
export default Manager;
