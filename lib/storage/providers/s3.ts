import "server-only";

import {
  CopyObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { S3ClientConfig } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { assertSafeObjectKey } from "../helpers";
import type {
  CreateUploadUrlInput,
  DownloadUrl,
  ObjectHead,
  StorageProvider,
  StoreObjectInput,
  UploadUrl,
} from "../types";

export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly signingClient: S3Client;
  private readonly bucket: string;

  constructor() {
    const bucket = process.env.STORAGE_BUCKET;
    const endpoint = process.env.STORAGE_ENDPOINT;
    const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID;
    const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY;
    const sessionToken = process.env.STORAGE_SESSION_TOKEN;

    if (!bucket) throw new Error("STORAGE_BUCKET is required");
    if (Boolean(accessKeyId) !== Boolean(secretAccessKey)) {
      throw new Error("STORAGE_ACCESS_KEY_ID and STORAGE_SECRET_ACCESS_KEY must be configured together");
    }
    if (endpoint && (!accessKeyId || !secretAccessKey)) {
      throw new Error("S3-compatible endpoints require storage access key credentials");
    }

    this.bucket = bucket;
    const clientConfig: S3ClientConfig = {
      region: process.env.STORAGE_REGION ?? "us-east-1",
      endpoint,
      forcePathStyle:
        process.env.STORAGE_FORCE_PATH_STYLE === undefined
          ? Boolean(endpoint)
          : process.env.STORAGE_FORCE_PATH_STYLE === "true",
      credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey, sessionToken } : undefined,
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    };
    this.client = new S3Client(clientConfig);
    const publicEndpoint = process.env.STORAGE_PUBLIC_ENDPOINT;
    this.signingClient = publicEndpoint ? new S3Client({ ...clientConfig, endpoint: publicEndpoint }) : this.client;
  }

  async createUploadUrl(input: CreateUploadUrlInput): Promise<UploadUrl> {
    assertSafeObjectKey(input.key);
    const url = await getSignedUrl(
      this.signingClient,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
        ContentType: input.contentType,
        ContentLength: input.contentLength,
      }),
      {
        expiresIn: input.expiresInSeconds,
        signableHeaders: new Set(["content-type", "content-length"]),
      },
    );

    return {
      url,
      method: "PUT",
      headers: { "Content-Type": input.contentType },
      expiresAt: new Date(Date.now() + input.expiresInSeconds * 1000),
    };
  }

  async createDownloadUrl(key: string, expiresInSeconds: number, fileName?: string): Promise<DownloadUrl> {
    assertSafeObjectKey(key);
    const url = await getSignedUrl(
      this.signingClient,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ResponseContentDisposition: fileName
          ? `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`
          : undefined,
      }),
      { expiresIn: expiresInSeconds },
    );

    return { url, expiresAt: new Date(Date.now() + expiresInSeconds * 1000) };
  }

  async storeObject(input: StoreObjectInput): Promise<void> {
    assertSafeObjectKey(input.key);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
        CacheControl: input.cacheControl,
        Metadata: input.metadata,
      }),
    );
  }

  async deleteObject(key: string): Promise<void> {
    assertSafeObjectKey(key);
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async deletePrefix(prefix: string): Promise<void> {
    assertSafeObjectKey(prefix);
    if (!prefix.endsWith("/")) throw new Error("Storage prefix must end with a slash");
    let continuationToken: string | undefined;
    do {
      const page = await this.client.send(
        new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix, ContinuationToken: continuationToken }),
      );
      const objects = (page.Contents ?? []).flatMap((item) => (item.Key ? [{ Key: item.Key }] : []));
      if (objects.length > 0) {
        await this.client.send(new DeleteObjectsCommand({ Bucket: this.bucket, Delete: { Objects: objects, Quiet: true } }));
      }
      continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (continuationToken);
  }

  async headObject(key: string, sniffBytes: number): Promise<ObjectHead | null> {
    assertSafeObjectKey(key);
    try {
      const meta = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      const object = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key, Range: `bytes=0-${Math.max(0, sniffBytes - 1)}` }),
      );
      return {
        contentType: meta.ContentType,
        contentLength: meta.ContentLength ?? 0,
        head: (await object.Body?.transformToByteArray()) ?? new Uint8Array(),
      };
    } catch (error) {
      const name = (error as { name?: string }).name;
      if (name === "NotFound" || name === "NoSuchKey") return null;
      throw error;
    }
  }

  async copyObject(fromKey: string, toKey: string): Promise<void> {
    assertSafeObjectKey(fromKey);
    assertSafeObjectKey(toKey);
    await this.client.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        Key: toKey,
        CopySource: `${this.bucket}/${fromKey.split("/").map(encodeURIComponent).join("/")}`,
        MetadataDirective: "COPY",
      }),
    );
  }
}
