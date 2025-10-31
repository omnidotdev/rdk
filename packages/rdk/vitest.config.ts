import { resolve } from "node:path";

import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

/**
 * Vitest configuration.
 * @see https://vitest.dev/config
 */
const vitestConfig = defineConfig({
  plugins: [tsconfigPaths()],
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
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  esbuild: {
    target: "node18",
  },
});

export default vitestConfig;
