import { put } from "@vercel/blob";

export const BLOB_ENABLED = Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);

/**
 * ストアがPublic/Privateどちらで作成されていても動くよう、
 * まずPublicで試し、失敗したらPrivateにフォールバックする。
 */
export async function blobPut(
  pathname: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  try {
    const blob = await put(pathname, buffer, { access: "public", contentType });
    return blob.url;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes("private store")) throw err;
    const blob = await put(pathname, buffer, { access: "private", contentType });
    return blob.url;
  }
}
