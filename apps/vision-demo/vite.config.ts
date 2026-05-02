import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import mkcert from "vite-plugin-mkcert";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * Vite configuration.
 * @see https://vite.dev/config
 */
const viteConfig = defineConfig({
  plugins: [react(), mkcert(), tsconfigPaths()],
  server: {
    host: true,
    port: 3000,
  },
  build: {
    outDir: "build",
  },
  worker: {
    format: "es",
  },
  optimizeDeps: {
    exclude: ["@omnidotdev/rdk"],
  },
  resolve: {
    alias: {
      // Resolve to source so Vite handles the worker natively
      "@omnidotdev/rdk/vision": resolve(
        __dirname,
        "../../packages/rdk/src/vision/index.ts",
      ),
      react: "react",
      "react-dom": "react-dom",
      three: "three",
      "@react-three/fiber": "@react-three/fiber",
    },
  },
});

export default viteConfig;
