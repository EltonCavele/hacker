/**
 * Upload allowlist. The browser-declared Content-Type is only a claim, so every type here also has a detector
 * that checks the first bytes of the stored object. SVG and HTML are deliberately absent: they can carry scripts.
 */
type Detector = (head: Uint8Array) => boolean;

const startsWith = (head: Uint8Array, bytes: number[], offset = 0) =>
  bytes.every((byte, index) => head[offset + index] === byte);
const ascii = (text: string) => [...text].map((char) => char.charCodeAt(0));

// Text has no magic number: accept it only when the head is free of NUL bytes and valid UTF-8.
const isText: Detector = (head) => {
  if (head.includes(0)) return false;
  try {
    // A multi-byte character cut by the head boundary is fine, so decode non-fatally on the last 3 bytes.
    new TextDecoder("utf-8", { fatal: true }).decode(head.subarray(0, Math.max(0, head.length - 3)));
    return true;
  } catch {
    return false;
  }
};

export const CONTENT_TYPE_DETECTORS = {
  "image/jpeg": (head) => startsWith(head, [0xff, 0xd8, 0xff]),
  "image/png": (head) => startsWith(head, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  "image/gif": (head) => startsWith(head, ascii("GIF87a")) || startsWith(head, ascii("GIF89a")),
  "image/webp": (head) => startsWith(head, ascii("RIFF")) && startsWith(head, ascii("WEBP"), 8),
  "image/avif": (head) => startsWith(head, ascii("ftypavif"), 4) || startsWith(head, ascii("ftypavis"), 4),
  "application/pdf": (head) => startsWith(head, ascii("%PDF-")),
  "text/plain": isText,
  "text/csv": isText,
} satisfies Record<string, Detector>;

export type AllowedContentType = keyof typeof CONTENT_TYPE_DETECTORS;

export const ALLOWED_CONTENT_TYPES = Object.keys(CONTENT_TYPE_DETECTORS) as [
  AllowedContentType,
  ...AllowedContentType[],
];

/** Bytes read from the start of an object to identify it. */
export const SNIFF_BYTES = 32;

export function matchesContentType(contentType: string, head: Uint8Array) {
  const detect = (CONTENT_TYPE_DETECTORS as Record<string, Detector | undefined>)[contentType];
  return detect ? detect(head) : false;
}
