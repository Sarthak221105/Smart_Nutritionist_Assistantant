import express from "express";
import multer from "multer";
import axios from "axios";
import fs from "fs";

const router = express.Router();

// store uploaded photo temporarily
const upload = multer({ dest: "uploads/" });

router.post("/analyze", upload.single("photo"), async (req, res) => {
  try {
    const { text } = req.body;
    const photoPath = req.file?.path;

    // send to Python service
    const formData = new FormData();
    if (photoPath) formData.append("photo", fs.createReadStream(photoPath));
    
    // Append all properties from req.body (text, goal, preferences, etc.)
    for (const [key, value] of Object.entries(req.body)) {
      formData.append(key, value);
    }

    const response = await axios.post("http://localhost:5001/analyze", formData, {
      headers: formData.getHeaders(),
    });

    // cleanup temp file
    if (photoPath) fs.unlinkSync(photoPath);

    res.json(response.data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
