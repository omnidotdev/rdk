import type { KnipConfig } from "knip";

export default {
  workspaces: {
    "packages/*": {
      project: ["src/**/*.{ts,tsx}"],
      ignore: [
        "build/**",
        "lib/**",
        "dist/**",
        "node_modules/**",
        // TODO: remove when exported types from this files are used (rdk workspace). Add individual ignore statements as needed
        "src/lib/types/xr/XRUtils.type.ts",
      ],
    },
    "apps/*": {
      entry: ["src/index.tsx"],
      project: ["src/**/*.{ts,tsx}"],
      ignore: ["build/**", "dist/**", "node_modules/**"],
      ignoreDependencies: [
        // TODO: remove when used within an app level workspace
        "@react-three/drei",
      ],
    },
  },
  ignoreBinaries: [
    // NB: `i` is used for `install` in github workflows, but knip provides a false positive. Views it as an unlisted binary
    "i",
  ],
  ignoreDependencies: [
    // NB: we use `turbo` at root level, thus biome presents as a false positive
    "@biomejs/biome",
  ],
  ignoreExportsUsedInFile: {
    interface: true,
    type: true,
  },
} satisfies KnipConfig;
