---
"@omnidotdev/rdk": patch
---

fix(build): resolve internal modules via a `@/` alias instead of `baseUrl`

TypeScript 7 removed the `baseUrl` compiler option, which the package relied on to resolve `src`-relative bare imports (e.g. `engine/useXRStore`, `lib/types/engine`). Under TS 7 this broke `vite-tsconfig-paths` resolution, failing the Vitest suite and the library build (including `.d.ts` emission).

Replace `baseUrl` with an explicit `@/*` -> `./src/*` path mapping and migrate internal imports to the `@/` prefix. Unlike bare `src`-relative imports, the `@/` prefix cannot collide with npm package names, so a future dependency named `engine`, `lib`, `vision`, etc. can no longer shadow local modules. `vite-tsconfig-paths` is now the single resolver for both build and test (the redundant Vitest `resolve.alias` was removed).
