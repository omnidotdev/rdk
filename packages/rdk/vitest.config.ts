import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

/**
 * Vitest configuration.
 * @see https://vitest.dev/config
 */
const vitestConfig = defineConfig({
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./test/setup.ts"],
	},
	resolve: {
		alias: {
			"@": resolve(__dirname, "./src"),
		},
	},
	esbuild: {
		target: "node14",
	},
});

export default vitestConfig;
