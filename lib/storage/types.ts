export type CreateUploadUrlInput = {
  key: string;
  contentType: string;
  contentLength: number;
  expiresInSeconds: number;
};

export type UploadUrl = {
  url: string;
  method: "PUT";
  headers: Record<string, string>;
  expiresAt: Date;
};

export type DownloadUrl = { url: string; expiresAt: Date };

export type StoreObjectInput = {
  key: string;
  body: Uint8Array;
  contentType: string;
  cacheControl?: string;
  metadata?: Record<string, string>;
};

export type ObjectHead = {
  contentType?: string;
  contentLength: number;
  /** First bytes of the object, for content sniffing. */
  head: Uint8Array;
};

export interface StorageProvider {
  createUploadUrl(input: CreateUploadUrlInput): Promise<UploadUrl>;
  createDownloadUrl(key: string, expiresInSeconds: number, fileName?: string): Promise<DownloadUrl>;
  storeObject(input: StoreObjectInput): Promise<void>;
  deleteObject(key: string): Promise<void>;
  /** Returns null when the object does not exist. */
  headObject(key: string, sniffBytes: number): Promise<ObjectHead | null>;
  copyObject(fromKey: string, toKey: string): Promise<void>;
  /** Deletes every object whose key starts with the prefix (e.g. all files of a deleted user). */
  deletePrefix(prefix: string): Promise<void>;
}
