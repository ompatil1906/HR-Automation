export function isPdfBuffer(data: Buffer | Uint8Array) {
  if (data.byteLength < 8) return false;
  return Buffer.from(data).subarray(0, 5).toString("ascii") === "%PDF-";
}

export function assertPdfBuffer(data: Buffer | Uint8Array) {
  if (!isPdfBuffer(data)) throw new Error("Generated resume is not a valid PDF document");
}
