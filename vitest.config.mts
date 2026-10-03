import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": root,
      // `server-only` throws outside the React Server condition; tests run in plain Node.
      "server-only": `${root}tests/stubs/server-only.ts`,
    },
  },
  test: {
    environment: "node",
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**", "generated/**"],
    env: { NODE_ENV: "test", LOG_LEVEL: "silent" },
    // Reset implementations too: a mockRejectedValue in one test must not leak into the next.
    mockReset: true,
    restoreMocks: true,
    unstubEnvs: true,
  },
});
