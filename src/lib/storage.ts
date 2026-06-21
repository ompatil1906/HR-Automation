import { put } from "@vercel/blob";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export async function storeFile(key: string, data: Buffer, contentType: string) {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(key, data, { access: "public", contentType, addRandomSuffix: false });
    return blob.url;
  }
  const safe = key.replace(/^\/+/, "");
  const fullPath = path.join(process.cwd(), "public", "generated", safe);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, data);
  return `/generated/${safe}`;
}

export async function fetchFile(url: string) {
  if (url.startsWith("/generated/")) {
    const { readFile } = await import("node:fs/promises");
    return readFile(path.join(process.cwd(), "public", url));
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error("Unable to load stored file");
  return Buffer.from(await response.arrayBuffer());
}
