import { defineConfig } from "tsup";
import { copyFileSync } from "fs";
import { resolve } from "path";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  external: ["vue", "@milkdown/kit"],
  noExternal: ["@xz-summer/milkdown-slash-menu-core"],
  onSuccess: async () => {
    // 复制 core 包的样式文件
    const corePath = resolve(__dirname, "../slash-menu-core/dist/style.css");
    const destPath = resolve(__dirname, "dist/style.css");
    copyFileSync(corePath, destPath);
    console.log("Copied style.css from core package");
  },
});
