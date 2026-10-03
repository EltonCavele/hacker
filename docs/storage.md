# Storage

Object storage access is provided by `lib/storage`. The current adapter uses the S3 API and supports S3-compatible services such as MinIO.

## Upload flow

1. An authenticated client posts `contentType` and `contentLength` to `/api/storage/upload`. Only the types in `lib/storage/content-types.ts` are accepted (JPEG, PNG, GIF, WebP, AVIF, PDF, plain text, CSV); SVG and HTML are excluded on purpose because they can carry scripts.
2. The route validates the request and calls `createUploadUrlForUser`.
3. The service creates a random key under `pending/users/<id>/` and a five-minute signed `PUT` URL.
4. The client uploads directly to the returned URL.
5. The client posts the key to `/api/storage/upload/complete`. The server reads the object's first bytes and checks size, allowed type and that the bytes match the declared type (magic numbers). On success the object is moved to `users/<id>/<uuid>` and that permanent key is returned for the application record; otherwise it is deleted (HTTP 422, or 404 if missing).

Only keys returned by step 5 should be saved. The upload size limit is `STORAGE_MAX_UPLOAD_BYTES` (25 MiB by default). The signed request binds the content type and length. Configure bucket CORS for the app origin, `PUT`, and the `Content-Type` header.

### Orphan cleanup

Abandoned or rejected uploads stay under `pending/`. Add a bucket lifecycle rule that expires that prefix after one day. Compose's `minio-init` does it for MinIO; elsewhere, for example on S3: `aws s3api put-bucket-lifecycle-configuration --bucket <bucket> --lifecycle-configuration '{"Rules":[{"ID":"expire-pending","Status":"Enabled","Filter":{"Prefix":"pending/"},"Expiration":{"Days":1}}]}'`. Also add a rule to abort incomplete multipart uploads. Objects deleted from your database records still need `deleteStoredObject` (or your own sweep).

## Important files

- `lib/storage/types.ts`: provider contract.
- `lib/storage/providers/s3.ts`: S3-compatible implementation and signed URLs.
- `lib/storage/helpers.ts`: object-key validation.
- `features/storage/service.ts`: input validation and user-scoped keys.
- `app/api/storage/upload/route.ts`: authentication and HTTP validation.

## Access and configuration

Download URL creation and object deletion are server-side operations. Check ownership and authorization in the feature before calling them. Do not accept arbitrary object keys from a client without checking access. Configure `STORAGE_BUCKET`, and configure endpoint, region, credentials, and public signing endpoint as needed. Keep credentials server-only.
