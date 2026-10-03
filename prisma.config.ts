import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Host commands (`prisma migrate dev`) read `.env`. Docker Compose only provides `.env.docker`.
config({ path: ".env" });
config({ path: ".env.docker" });

const databaseUrl = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/app";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  datasource: { url: databaseUrl },
});
