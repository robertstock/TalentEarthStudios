import { Router } from "express";
const router = Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  // TODO: create user, hash password, store in DB
  res.json({ ok: true, message: "register placeholder" });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  // TODO: verify credentials, return JWT
  res.json({ ok: true, message: "login placeholder" });
});

export default router;
