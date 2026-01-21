import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// GET /api/posts/feed
router.get("/feed", async (req, res) => {
  // TODO: return personalized feed
  res.json({ items: [] });
});

// POST /api/posts
router.post("/", requireAuth, async (req, res) => {
  // TODO: create post with text + media references
  res.status(201).json({ ok: true, post: { id: "post_123", ...req.body } });
});

export default router;
