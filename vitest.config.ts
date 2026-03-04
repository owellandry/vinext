import { randomUUID } from "node:crypto";
import { defineConfig } from "vitest/config";

// Server tests spin up Vite dev servers — running too many concurrently
// overwhelms the OS (ports, memory, file descriptors). Pure tests are
// lightweight and benefit from full parallelism.
//
// We use `maxWorkers` to cap concurrency at a level that lets pure tests
// fly while keeping server tests from starving each other.

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    testTimeout: 30000,
    env: {
      // Mirrors the Vite `define` in index.ts that inlines a build-time UUID.
      // Setting it here means tests exercise the same code path as production.
      __OPENVITE_DRAFT_SECRET: randomUUID(),
    },
    // Each test server now gets its own optimizeDeps.cacheDir (see helpers.ts),
    // so the deps-cache race is solved. We enable parallelism and cap workers
    // to avoid overwhelming the system with too many concurrent Vite servers.
    fileParallelism: true,
    pool: "forks",
    poolOptions: {
      forks: {
        maxForks: 6,
      },
    },
    // GitHub Actions reporter adds inline failure annotations in PR diffs.
    reporters: process.env.CI
      ? ["default", "github-actions"]
      : ["default"],
  },
});
