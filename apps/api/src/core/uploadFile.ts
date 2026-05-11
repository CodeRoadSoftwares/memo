import fs from "fs";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "./r2.js";

export async function uploadFile(
  filePath: string,
  key: string,
  mimeType: string
) {
  const fileBuffer = fs.readFileSync(filePath);
  return uploadFileBuffer(fileBuffer, key, mimeType);
}

export async function uploadFileBuffer(
  buffer: Buffer,
  key: string,
  mimeType: string
) {
  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: mimeType
    })
  );

  return key;
}

export async function getFileBuffer(key: string): Promise<Buffer | null> {
  try {
    const response = await r2.send(
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
      })
    );

    if (!response.Body) return null;
    
    // Convert stream to buffer
    const byteArray = await response.Body.transformToByteArray();
    return Buffer.from(byteArray);
  } catch (err) {
    console.error(`[R2] Failed to fetch file buffer for key: ${key}`, err);
    return null;
  }
}
