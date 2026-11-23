import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    fileParallelism: false,
    include: ["tests/**/*.test.ts"],
    exclude: ["node_modules", "references", ".next"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});

