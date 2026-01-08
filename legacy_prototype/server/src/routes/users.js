import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// GET /api/users/:id
router.get("/:id", async (req, res) => {
  // TODO: fetch user profile from DB
  res.json({ id: req.params.id, username: "placeholder", bio: "" });
});

// PATCH /api/users/:id
router.patch("/:id", requireAuth, async (req, res) => {
  // TODO: update user profile
  res.json({ ok: true, id: req.params.id, updates: req.body });
});

export default router;
