import type { Plugin } from 'vite';

import { tailwindShadowCssPostcssPlugin } from './tailwind-shadow-css.module';

/**
 * Registers the Tailwind shadow DOM PostCSS transform in Vite's CSS pipeline.
 */
export function tailwindShadowCssVitePlugin(): Plugin {
  return {
    name: 'tailwind-shadow-css',
    config() {
      return {
        css: {
          postcss: {
            plugins: [tailwindShadowCssPostcssPlugin()],
          },
        },
      };
    },
  };
}
