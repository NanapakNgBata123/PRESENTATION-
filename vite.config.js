import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const root = import.meta.dirname;
const mainSha256 = createHash("sha256").update(readFileSync(resolve(root, "python/main.py"))).digest("hex");

export default defineConfig({
  base: "./",
  plugins: [react()],
  define: { __MAIN_SHA256__: JSON.stringify(mainSha256) },
  worker: { format: "es" },
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, "index.html"),
        presentation: resolve(root, "presentation/index.html"),
      },
    },
  },
});
