import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Vitest doesn't read tsconfig.json's "paths" on its own -- mirror the @/* alias here.
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
