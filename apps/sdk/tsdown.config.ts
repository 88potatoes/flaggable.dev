import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "frontend/core/index.ts",
    core: "frontend/core/index.ts",
    react: "frontend/react/index.tsx",
    cli: "frontend/cli.ts",
  },
  format: ["esm"],
  dts: true,
  tsconfig: "frontend/tsconfig.json",
  outDir: "dist",
  clean: true,
  deps: { neverBundle: ["react", "react-dom"] },
});
