import { S3Client } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
    region: process.env.S3_REGION || "us-west-2",
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
    },
});

export const BUCKET_PUBLIC = process.env.S3_BUCKET_PUBLIC || "";
export const BUCKET_PRIVATE = process.env.S3_BUCKET_PRIVATE || "";
