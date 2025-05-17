import builtins from 'builtin-modules';
import glsl from 'vite-plugin-glsl';
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  return {
    plugins: [glsl()],
    build: {
      lib: {
        entry: "main.ts",
        formats: ["cjs"],
      },
      rollupOptions: {
        output: {
          entryFileNames: 'main.js',
          assetFileNames: 'styles.css',
          exports: "named",
        },
        external: [
          "obsidian",
          "electron",
          "@codemirror/autocomplete",
          "@codemirror/collab",
          "@codemirror/commands",
          "@codemirror/language",
          "@codemirror/lint",
          "@codemirror/search",
          "@codemirror/state",
          "@codemirror/view",
          "@lezer/common",
          "@lezer/highlight",
          "@lezer/lr",
          ...builtins,
        ],
      },
      minify: mode === "production",
      sourcemap: mode === "development",
      outDir: "",
      emptyOutDir: false,
    },
  };
});