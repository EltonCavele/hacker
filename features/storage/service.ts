import "server-only";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { ALLOWED_CONTENT_TYPES, SNIFF_BYTES, matchesContentType } from "@/lib/storage/content-types";
import { getStorageProvider } from "@/lib/storage";

const maxUploadBytes = Number(process.env.STORAGE_MAX_UPLOAD_BYTES ?? 25 * 1024 * 1024);
if (!Number.isSafeInteger(maxUploadBytes) || maxUploadBytes < 1) {
  throw new Error("STORAGE_MAX_UPLOAD_BYTES must be a positive integer");
}

/**
 * Uploads land under `pending/` and only move to `users/` after `finalizeUploadForUser` has checked them. A bucket
 * lifecycle rule expires `pending/` after a day, so abandoned or rejected uploads clean themselves up.
 */
export const PENDING_PREFIX = "pending/";

export const uploadRequestSchema = z.object({
  contentType: z.enum(ALLOWED_CONTENT_TYPES),
  contentLength: z.number().int().positive().max(maxUploadBytes),
});

export const finalizeUploadSchema = z.object({ key: z.string().min(1).max(300) });

export class UploadRejectedError extends Error {
  constructor(readonly reason: "missing" | "too-large" | "type-not-allowed" | "content-mismatch") {
    super(`Upload rejected: ${reason}`);
    this.name = "UploadRejectedError";
  }
}

const userPrefix = (userId: string) => `users/${encodeURIComponent(userId)}/`;

export async function createUploadUrlForUser(userId: string, input: z.infer<typeof uploadRequestSchema>) {
  const key = `${PENDING_PREFIX}${userPrefix(userId)}${randomUUID()}`;
  const upload = await getStorageProvider().createUploadUrl({
    key,
    contentType: input.contentType,
    contentLength: input.contentLength,
    expiresInSeconds: 300,
  });

  return { key, ...upload };
}

/**
 * Verifies an uploaded object (size, allowed type, and that its bytes really match the declared type) and promotes it
 * out of `pending/`. Returns the permanent key to store on the application record. Rejected objects are deleted.
 */
export async function finalizeUploadForUser(userId: string, pendingKey: string) {
  const expectedPrefix = `${PENDING_PREFIX}${userPrefix(userId)}`;
  if (!pendingKey.startsWith(expectedPrefix) || pendingKey.includes("..")) throw new UploadRejectedError("missing");

  const storage = getStorageProvider();
  const object = await storage.headObject(pendingKey, SNIFF_BYTES);
  if (!object) throw new UploadRejectedError("missing");

  const reject = async (reason: ConstructorParameters<typeof UploadRejectedError>[0]) => {
    await storage.deleteObject(pendingKey).catch(() => undefined);
    throw new UploadRejectedError(reason);
  };

  if (object.contentLength > maxUploadBytes) return reject("too-large");
  const declared = object.contentType?.split(";")[0].trim().toLowerCase() ?? "";
  if (!(ALLOWED_CONTENT_TYPES as string[]).includes(declared)) return reject("type-not-allowed");
  if (!matchesContentType(declared, object.head)) return reject("content-mismatch");

  const key = pendingKey.slice(PENDING_PREFIX.length);
  await storage.copyObject(pendingKey, key);
  await storage.deleteObject(pendingKey);
  return { key, contentType: declared, contentLength: object.contentLength };
}

export async function createDownloadUrl(key: string, fileName?: string) {
  return getStorageProvider().createDownloadUrl(key, 300, fileName);
}

export async function deleteStoredObject(key: string) {
  return getStorageProvider().deleteObject(key);
}
