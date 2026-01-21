import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error.js";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import postRoutes from "./routes/posts.js";
import mediaRoutes from "./routes/media.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

// Static uploads (dev only). Replace with signed URLs + object storage for production.
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/api/health", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/media", mediaRoutes);

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`API listening on http://localhost:${env.port}`);
});
