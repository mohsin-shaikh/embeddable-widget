# Embeddable Widget

A React-based embeddable widget shipped as a custom element (`<embed-widget>`). It mounts inside an open Shadow Root with inlined Tailwind CSS so host-page styles do not leak in, and a single ES module can be dropped onto any site.

## Features

- **Custom element API** — register once, then use `<embed-widget>` anywhere on the page
- **Shadow DOM isolation** — UI and styles live in an open shadow root
- **Single-file style bundle** — Tailwind is compiled and inlined into the embed script
- **Shadow-safe Tailwind** — a custom PostCSS transform rewrites `--tw-*` property fallbacks for `:host` and related selectors
- **Document-level fonts** — Open Sans is registered via the FontFace API on the host document so Shadow DOM consumers can use it reliably

## Tech stack

| Layer        | Choice                          |
| ------------ | ------------------------------- |
| UI           | React 19                        |
| Build        | Vite 7 (library mode)           |
| Language     | TypeScript                      |
| Styling      | Tailwind CSS 4                  |
| Delivery     | ES module (`dist/embed.js`)     |

## Getting started

### Prerequisites

- Node.js 20+ (recommended)
- npm

### Install

```bash
npm install
```

### Develop

Starts the Vite dev server with a local host page that already includes `<embed-widget>`:

```bash
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

### Build

Produces the embeddable library under `dist/`:

```bash
npm run build
```

Output:

- `dist/embed.js` — ES module entry (registers the custom element)
- `dist/embed.js.map` — source map

### Preview the production build

```bash
npm run preview
```

## Embed on a host page

1. Host `dist/embed.js` (and any Font/asset URLs that Vite emits with it) on your CDN or static origin.
2. Load the module and place the custom element:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Host page</title>
  </head>
  <body>
    <embed-widget></embed-widget>
    <script type="module" src="/path/to/embed.js"></script>
  </body>
</html>
```

Calling `registerEmbedWidget()` (done automatically by `src/main.tsx`) defines the element once per page if it is not already registered.

## Project structure

```text
embeddable-widget/
├── assets/fonts/          # Open Sans woff2 files
├── postcss/
│   ├── tailwind-shadow-css.module.ts
│   └── tailwind-shadow-css-vite-plugin.ts
├── src/
│   ├── main.tsx                 # Entry: registers the custom element
│   ├── main.css                 # Tailwind + theme (Open Sans)
│   ├── embed-widget.module.tsx  # Web component + Shadow Root mount
│   ├── components/
│   │   └── embed-component.tsx  # React UI
│   └── lib/
│       └── font-loader-module.ts
├── index.html             # Local dev host page
└── vite.config.ts         # Library build (`formats: ['es']`, fileName `embed`)
```

## How it works

### Custom element + React

`EmbedWidget` extends `HTMLElement`, attaches an open shadow root, injects the compiled CSS as a `<style>` tag, and mounts React with `createRoot` on that shadow root. On `connectedCallback`, it renders `EmbedWidgetComponent`.

### Tailwind inside Shadow DOM

Stock Tailwind relies on `@property` / universal-selector fallbacks for `--tw-*` variables. Those do not always apply correctly under a shadow root. The `tailwind-shadow-css` PostCSS plugin:

1. Collects Tailwind `--tw-*` initial values
2. Expands fallback selectors to include `:host` and related pseudos
3. Ensures a concrete fallback rule exists under `@layer properties`

This runs in Vite’s CSS pipeline via `tailwindShadowCssVitePlugin`.

### Fonts

`@font-face` inside a shadow tree is fragile across browsers. `ensureFontFaces` loads the bundled woff2 files with `FontFace` and adds them to `document.fonts` so the widget can use `font-sans` (Open Sans) from the shadow tree.

## Scripts

| Command           | Description                                      |
| ----------------- | ------------------------------------------------ |
| `npm run dev`     | Dev server with hot reload                       |
| `npm run build`   | Typecheck (`tsc -b`) and build the ES library    |
| `npm run preview` | Serve the production build locally               |

## Customize

- **UI** — edit `src/components/embed-component.tsx`
- **Theme / fonts** — adjust `@theme` in `src/main.css` and font definitions in `src/lib/font-loader-module.ts`
- **Tag name** — change `EMBED_WIDGET_TAG_NAME` in `src/embed-widget.module.tsx` (keep the HTML usage and any host embeds in sync)

## License

Private project (`"private": true` in `package.json`).
