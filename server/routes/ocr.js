import express from "express";
import multer from "multer";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const upload = multer({ dest: path.join(__dirname, "..", "uploads/") }); // Store images in 'uploads' folder

router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      console.error("[OCR ERROR] No image file uploaded.");
      return res.status(400).json({ error: "No image file provided. Please upload an image." });
    }

    const imagePath = path.join(__dirname, "..", req.file.path);
    console.log(`[OCR] Processing image: ${imagePath}`);

    exec(`python extract_text.py "${imagePath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error("[OCR EXECUTION ERROR]", error);
        return res.status(500).json({ 
          error: "Failed to process the image. OCR script execution failed.", 
          details: error.message 
        });
      }
      
      if (stderr) {
        console.warn("[OCR WARNING]", stderr);
      }

      const extractedText = stdout.trim();
      if (!extractedText) {
        console.warn("[OCR] No text extracted from image.");
        return res.status(400).json({ error: "No text could be extracted from the image. Try a clearer image." });
      }

      // Delete image after processing
      fs.unlink(imagePath, (unlinkError) => {
        if (unlinkError) {
          console.error("[FILE DELETE ERROR]", unlinkError);
        } else {
          console.log(`[OCR] Successfully deleted processed image: ${imagePath}`);
        }
      });

      res.json({ extractedText });
    });

  } catch (error) {
    console.error("[OCR SERVER ERROR]", error);
    res.status(500).json({ 
      error: "Internal server error while processing image.", 
      details: error.message 
    });
  }
});

export default router;
