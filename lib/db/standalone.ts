// Prisma client for processes that run outside Next.js (the BullMQ worker, seed script): plain tsx, so no
// "server-only", no path aliases and no getEnv() memoisation. The app itself uses lib/db/client.ts.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

const globalForStandalone = globalThis as unknown as { standalonePrisma?: PrismaClient };

export const standalonePrisma =
  globalForStandalone.standalonePrisma ??
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/app",
      max: Number(process.env.DATABASE_POOL_MAX) || undefined,
    }),
  });

globalForStandalone.standalonePrisma = standalonePrisma;
