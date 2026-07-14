import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

import { tailwindShadowCssVitePlugin } from "./postcss/tailwind-shadow-css-vite-plugin";

/**
 * Library builds skip the HTML app pipeline. Reuse the root host page and point
 * its module script at the built embed asset so `vite preview` works.
 */
function emitPreviewHostHtml(): Plugin {
  return {
    name: "emit-preview-host-html",
    apply: "build",
    generateBundle() {
      const html = readFileSync(resolve(__dirname, "index.html"), "utf8").replace(
        /src="\/src\/main\.tsx"/,
        'src="./embed.js"',
      );

      this.emitFile({
        type: "asset",
        fileName: "index.html",
        source: html,
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  return {
    base: "./",
    define: {
      "process.env.NODE_ENV": JSON.stringify(mode),
    },
    plugins: [
      tsconfigPaths(),
      tailwindcss(),
      tailwindShadowCssVitePlugin(),
      react(),
      emitPreviewHostHtml(),
    ],
    build: {
      target: "es2020",
      lib: {
        entry: resolve(__dirname, "src/main.tsx"),
        fileName: "embed",
        formats: ["es"],
      },
      // Keep maps off the published embed asset; enable locally via --mode development.
      sourcemap: mode !== "production",
    },
  };
});
