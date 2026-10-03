import "server-only";

import Redis from "ioredis";
import { getEnv } from "../env";

const globalForRedis = globalThis as unknown as { redisClient?: Redis };

export const redis =
  globalForRedis.redisClient ??
  new Redis(getEnv().REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });

if (process.env.NODE_ENV !== "production") globalForRedis.redisClient = redis;
