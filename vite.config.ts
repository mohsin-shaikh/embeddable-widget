import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
// vite.config.ts
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

import { tailwindShadowCssVitePlugin } from "./postcss/tailwind-shadow-css-vite-plugin";

/** Library builds omit index.html; emit a host page so `vite preview` can load embed.js. */
function emitPreviewHostHtml(): Plugin {
  return {
    name: "emit-preview-host-html",
    apply: "build",
    closeBundle() {
      const html = `<!doctype html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Embed Widget Preview</title>
          </head>
          <body>
            <ew-embed-widget
              heading="Embed Widget"
              cta-label="Get Started"
              theme="light"
            ></ew-embed-widget>
            <script type="module" src="./embed.js"></script>
          </body>
        </html>
      `;
      writeFileSync(resolve(__dirname, "dist/index.html"), html);
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
