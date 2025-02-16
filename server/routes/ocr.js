import express from "express";
import multer from "multer";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";  // ✅ Import mongoose
import Manager from "../models/Manager.js";  // ✅ Import MongoDB Model

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const upload = multer({ dest: path.join(__dirname, "..", "uploads/") });

router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      console.error("[OCR ERROR] No image file received.");
      return res.status(400).json({ error: "No image file provided. Ensure you are sending FormData." });
    }

    const imagePath = req.file.path;
    const scriptPath = path.join(__dirname, "..", "ocr.py");

    console.log(`[OCR] Running script: ${scriptPath} with image: ${imagePath}`);

    exec(`python "${scriptPath}" "${imagePath}"`, async (error, stdout, stderr) => {
      if (error) {
        console.error("[OCR EXECUTION ERROR]", stderr || error.message);
        return res.status(500).json({ error: "OCR script execution failed.", details: stderr || error.message });
      }

      try {
        const response = JSON.parse(stdout);
        const extractedText = response.text.trim();

        if (!extractedText) {
          console.warn("[OCR] No text extracted from image.");
          return res.status(400).json({ error: "No text could be extracted from the image. Try a clearer image." });
        }

        console.log(`[OCR RESULT]: ${extractedText}`);  // ✅ Log extracted text to terminal

        // ✅ Store extracted text in MongoDB
        const managerData = new Manager({
          managerId: response.managerId || "Unknown",
          name: response.name || "Unknown",
          phoneNumber: response.phoneNumber || "Unknown",
          extractedText: extractedText, // Save extracted text
          uploadedAt: new Date(), // Store timestamp
        });

        await managerData.save();  // ✅ Save data to MongoDB
        console.log("[MongoDB] Data inserted successfully!");

        // Delete image after processing
        fs.unlink(imagePath, (unlinkError) => {
          if (unlinkError) console.error("[FILE DELETE ERROR]", unlinkError);
        });

        res.json({ extractedText, savedData: managerData });

      } catch (parseError) {
        console.error("[OCR PARSE ERROR]", parseError);
        res.status(500).json({ error: "Failed to parse OCR response.", details: parseError.message });
      }
    });

  } catch (error) {
    console.error("[OCR SERVER ERROR]", error);
    res.status(500).json({ error: "Internal server error while processing image.", details: error.message });
  }
});

export default router;