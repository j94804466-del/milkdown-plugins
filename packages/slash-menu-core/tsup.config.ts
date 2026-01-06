import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  external: ["@milkdown/kit"],
  onSuccess: async () => {
    const fs = await import("fs/promises");
    await fs.copyFile("src/style.css", "dist/style.css");
  },
});
