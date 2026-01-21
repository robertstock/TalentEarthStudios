import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { requireAuth } from "../middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, "..", "..", "uploads");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}_${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB dev limit
});

const router = Router();

// POST /api/media (multipart/form-data, field name: file)
router.post("/", requireAuth, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  // TODO: store media metadata in DB (ownerId, mimeType, size, url, etc.)
  res.status(201).json({
    ok: true,
    media: {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`,
    },
  });
});

export default router;
