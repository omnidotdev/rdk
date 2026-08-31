import { resolve } from "node:path";

import { defineConfig } from "vitest/config";

/**
 * Vitest configuration.
 * @see https://vitest.dev/config
 */
const vitestConfig = defineConfig({
  // Vitest 4 does not honor Vite's native `resolve.tsconfigPaths`, so map the
  // `@/*` alias explicitly here (the Vite build uses native resolution instead)
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    // enable `__mocks__` directory for automatic module mocking
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
    // ensure proper DOM environment
    environmentOptions: {
      jsdom: {
        url: "http://localhost:3000",
        pretendToBeVisual: true,
      },
    },
  },
  esbuild: {
    target: "node18",
  },
});

export default vitestConfig;
