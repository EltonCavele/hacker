import "server-only";

import { S3StorageProvider } from "./providers/s3";
import type { StorageProvider } from "./types";

let storageProvider: StorageProvider | undefined;

export function getStorageProvider(): StorageProvider {
  if (storageProvider) return storageProvider;

  const providerName = process.env.STORAGE_PROVIDER ?? "s3";
  if (providerName !== "s3") {
    throw new Error(`Unsupported storage provider: ${providerName}`);
  }

  storageProvider = new S3StorageProvider();
  return storageProvider;
}

export type {
  CreateUploadUrlInput,
  DownloadUrl,
  StorageProvider,
  StoreObjectInput,
  UploadUrl,
} from "./types";
