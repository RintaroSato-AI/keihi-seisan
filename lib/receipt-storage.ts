import { randomUUID } from "crypto";
import path from "path";
import { mkdir, writeFile } from "fs/promises";
import { BLOB_ENABLED, blobPut } from "@/lib/blob-put";

const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "receipts");

export async function saveReceiptImage(file: File): Promise<string> {
  const ext = (file.type.split("/")[1] ?? "jpg").replace("jpeg", "jpg");
  const filename = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (BLOB_ENABLED) {
    return blobPut(`receipts/${filename}`, buffer, file.type);
  }

  await mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(LOCAL_UPLOAD_DIR, filename), buffer);
  return `/uploads/receipts/${filename}`;
}
