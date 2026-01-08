import dotenv from "dotenv";

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 8080),

  // TODO: wire these when you add a real auth + database layer
  jwtSecret: process.env.JWT_SECRET || "dev-only-change-me",

  // For cloud storage later (S3/R2/GCS)
  mediaProvider: process.env.MEDIA_PROVIDER || "local", // local | s3
  s3Bucket: process.env.S3_BUCKET || "",
  s3Region: process.env.S3_REGION || "",
};
