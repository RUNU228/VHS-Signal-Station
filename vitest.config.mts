import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
    setupFiles: ["./src/test/setup.ts"],
    restoreMocks: true,
  },
});
