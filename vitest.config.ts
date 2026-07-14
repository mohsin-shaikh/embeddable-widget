import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["postcss/**/*.test.ts", "src/**/*.test.ts"],
  },
});
