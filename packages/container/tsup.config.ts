import { defineConfig } from "tsup";
import { copyFileSync } from "fs";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  external: ["@milkdown/kit", "remark-directive"],
  onSuccess: async () => {
    copyFileSync("src/style.css", "dist/style.css");
  },
});
