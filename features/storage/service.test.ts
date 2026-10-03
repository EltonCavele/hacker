import { beforeEach, describe, expect, it, vi } from "vitest";

const storage = vi.hoisted(() => ({
  createUploadUrl: vi.fn(),
  headObject: vi.fn(),
  copyObject: vi.fn(),
  deleteObject: vi.fn(),
}));
vi.mock("@/lib/storage", () => ({ getStorageProvider: () => storage }));

import { UploadRejectedError, createUploadUrlForUser, finalizeUploadForUser, uploadRequestSchema } from "./service";

const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const pending = "pending/users/u1/abc";

beforeEach(() => {
  storage.createUploadUrl.mockResolvedValue({ url: "https://s3/put" });
  storage.deleteObject.mockResolvedValue(undefined);
});

describe("uploadRequestSchema", () => {
  it("accepts allowed types and rejects scriptable or unknown ones", () => {
    expect(uploadRequestSchema.safeParse({ contentType: "image/png", contentLength: 10 }).success).toBe(true);
    expect(uploadRequestSchema.safeParse({ contentType: "image/svg+xml", contentLength: 10 }).success).toBe(false);
    expect(uploadRequestSchema.safeParse({ contentType: "text/html", contentLength: 10 }).success).toBe(false);
  });
});

describe("createUploadUrlForUser", () => {
  it("issues a pending, user-scoped key", async () => {
    const { key } = await createUploadUrlForUser("u1", { contentType: "image/png", contentLength: 10 });
    expect(key).toMatch(/^pending\/users\/u1\/[0-9a-f-]{36}$/);
  });
});

describe("finalizeUploadForUser", () => {
  it("promotes a verified object out of pending/", async () => {
    storage.headObject.mockResolvedValue({ contentType: "image/png", contentLength: 12, head: PNG });
    expect(await finalizeUploadForUser("u1", pending)).toEqual({
      key: "users/u1/abc",
      contentType: "image/png",
      contentLength: 12,
    });
    expect(storage.copyObject).toHaveBeenCalledWith(pending, "users/u1/abc");
    expect(storage.deleteObject).toHaveBeenCalledWith(pending);
  });

  it("rejects and deletes an object whose bytes do not match its declared type", async () => {
    storage.headObject.mockResolvedValue({
      contentType: "image/png",
      contentLength: 12,
      head: new TextEncoder().encode("<script>alert(1)"),
    });
    await expect(finalizeUploadForUser("u1", pending)).rejects.toMatchObject({ reason: "content-mismatch" });
    expect(storage.deleteObject).toHaveBeenCalledWith(pending);
    expect(storage.copyObject).not.toHaveBeenCalled();
  });

  it("rejects types outside the allowlist", async () => {
    storage.headObject.mockResolvedValue({
      contentType: "text/html",
      contentLength: 5,
      head: new TextEncoder().encode("<html"),
    });
    await expect(finalizeUploadForUser("u1", pending)).rejects.toMatchObject({ reason: "type-not-allowed" });
  });

  it("refuses another user's key and never touches storage", async () => {
    await expect(finalizeUploadForUser("u2", pending)).rejects.toBeInstanceOf(UploadRejectedError);
    expect(storage.headObject).not.toHaveBeenCalled();
  });

  it("reports a missing object", async () => {
    storage.headObject.mockResolvedValue(null);
    await expect(finalizeUploadForUser("u1", pending)).rejects.toMatchObject({ reason: "missing" });
  });
});
