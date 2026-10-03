# Caching

The shared Redis cache helpers are in `lib/cache/redis-cache.ts`. Redis itself is initialized in `lib/redis/client.ts`.

## API

- `getOrSet(key, ttlSeconds, load)` returns a cached JSON value or loads and caches the source value.
- `invalidateCache(key)` removes one key.

Redis is an optimization: read, write, and delete errors are ignored. The source loader still runs if Redis is unavailable. Keep loaders correct without a cache.

## Key and invalidation rules

- Include the user or tenant ID in keys for private data. Example: `tasks:${user.id}`.
- Choose a finite TTL for every cache entry.
- Invalidate affected keys after successful writes. Current task mutations invalidate their user's task list.
- Avoid putting secrets or sensitive personal data in keys.

Cache values are JSON serialized. Use types that survive JSON serialization, and do not rely on class instances or special object prototypes being restored.
