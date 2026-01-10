import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/style.css"],
  format: ["esm"],
  dts: true,
  clean: true,
  external: [
    "@milkdown/kit",
    "@milkdown/preset-commonmark",
    "@codemirror/language",
    "mermaid",
    "codemirror-lang-mermaid",
  ],
  minify: false,
  sourcemap: true,
});
