import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import { getEnv } from "../env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const databaseUrl = getEnv().DATABASE_URL;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl, max: getEnv().DATABASE_POOL_MAX }),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
