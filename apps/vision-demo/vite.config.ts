import { resolve } from "node:path";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import mkcert from "vite-plugin-mkcert";

/**
 * Cross-origin isolation lets ONNX Runtime use multi-threaded wasm.
 * `credentialless` keeps cross-origin model and wasm downloads working
 * without each host sending a CORP header
 */
const CROSS_ORIGIN_ISOLATION = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "credentialless",
};

/**
 * Vite configuration.
 * @see https://vite.dev/config
 */
const viteConfig = defineConfig({
  plugins: [react(), tailwindcss(), mkcert()],
  server: {
    host: true,
    port: 3000,
    headers: CROSS_ORIGIN_ISOLATION,
  },
  preview: {
    headers: CROSS_ORIGIN_ISOLATION,
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
    // Vite 8 resolves tsconfig paths (the @/ alias) natively
    tsconfigPaths: true,
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
