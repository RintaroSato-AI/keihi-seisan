import { randomUUID } from "crypto";
import path from "path";
import { mkdir, writeFile } from "fs/promises";
import { put } from "@vercel/blob";

const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "receipts");

export async function saveReceiptImage(file: File): Promise<string> {
  const ext = (file.type.split("/")[1] ?? "jpg").replace("jpeg", "jpg");
  const filename = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID) {
    const blob = await put(`receipts/${filename}`, buffer, {
      access: "public",
      contentType: file.type,
    });
    return blob.url;
  }

  await mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(LOCAL_UPLOAD_DIR, filename), buffer);
  return `/uploads/receipts/${filename}`;
}
