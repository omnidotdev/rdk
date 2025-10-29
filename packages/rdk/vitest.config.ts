import { defineConfig } from "vitest/config";

const vitestConfig = defineConfig({
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./test/setup.ts"],
	},
	resolve: {
		alias: {
			"@": "./src",
		},
	},
});

export default vitestConfig;
