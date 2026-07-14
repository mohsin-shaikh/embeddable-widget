// vite.config.ts
import { resolve } from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

import { tailwindShadowCssVitePlugin } from './postcss/tailwind-shadow-css-vite-plugin';

export default defineConfig(({ mode }) => {
  return {
    base: './',
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    plugins: [
      tsconfigPaths(),
      tailwindcss(),
      tailwindShadowCssVitePlugin(),
      react(),
    ],
    build: {
      target: 'es2020',
      lib: {
        entry: resolve(__dirname, 'src/main.tsx'),
        fileName: 'embed',
        formats: ['es'],
      },
      sourcemap: true,
    },
  };
});