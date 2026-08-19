import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
      "cloudflare:workers": path.resolve(__dirname, "test/cloudflare-workers.ts"),
    },
  },
  test: {
    include: ["lib/**/*.test.ts", "slices/**/*.test.ts"],
  },
});
