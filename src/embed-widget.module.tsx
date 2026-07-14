import { createRoot, type Root } from "react-dom/client";

import { EmbedWidgetComponent } from "./components/embed-component";
import { ThemeProvider } from "./components/theme-provider";

import styles from "./main.css?inline";

/** Namespaced custom element tag to reduce collision risk on host pages. */
export const EMBED_WIDGET_TAG_NAME = "ew-embed-widget";

const OBSERVED_ATTRIBUTES = ["heading", "cta-label", "theme"] as const;
const THEME_STORAGE_KEY = "ew-theme";

export type EmbedWidgetAttributeName = (typeof OBSERVED_ATTRIBUTES)[number];

/**
 * Web Component that mounts the React widget inside an open Shadow Root with
 * inlined Tailwind styles (single embed.js asset for host pages).
 */
export class EmbedWidget extends HTMLElement {
  static get observedAttributes(): string[] {
    return [...OBSERVED_ATTRIBUTES];
  }

  #shadowRoot: ShadowRoot;
  #mountEl: HTMLDivElement;
  #root: Root | null = null;

  constructor() {
    super();

    this.#shadowRoot = this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = styles;
    style.setAttribute("type", "text/css");
    this.#shadowRoot.appendChild(style);

    this.#mountEl = document.createElement("div");
    this.#mountEl.setAttribute("data-ew-root", "");
    this.#shadowRoot.appendChild(this.#mountEl);
  }

  connectedCallback() {
    if (!this.#root) {
      this.#root = createRoot(this.#mountEl);
    }

    this.#render();
  }

  disconnectedCallback() {
    this.#root?.unmount();
    this.#root = null;
  }

  attributeChangedCallback(_name: string, oldValue: string | null, newValue: string | null) {
    if (oldValue === newValue || !this.#root) {
      return;
    }

    this.#render();
  }

  #render() {
    if (!this.#root) {
      return;
    }

    const themeAttribute = this.getAttribute("theme");
    const defaultTheme =
      themeAttribute === "dark" || themeAttribute === "light" || themeAttribute === "system"
        ? themeAttribute
        : "system";

    // Host `theme` attribute is authoritative when present.
    if (themeAttribute === defaultTheme) {
      localStorage.setItem(THEME_STORAGE_KEY, defaultTheme);
    }

    this.#root.render(
      <ThemeProvider
        key={defaultTheme}
        defaultTheme={defaultTheme}
        storageKey={THEME_STORAGE_KEY}
        themeRoot={this.#mountEl}
      >
        <EmbedWidgetComponent
          heading={this.getAttribute("heading") ?? undefined}
          ctaLabel={this.getAttribute("cta-label") ?? undefined}
          onReady={() => {
            this.dispatchEvent(
              new CustomEvent("ew-ready", {
                bubbles: true,
                composed: true,
              }),
            );
          }}
          onError={(error) => {
            this.dispatchEvent(
              new CustomEvent("ew-error", {
                detail: { error },
                bubbles: true,
                composed: true,
              }),
            );
          }}
          onCta={() => {
            this.dispatchEvent(
              new CustomEvent("ew-cta", {
                bubbles: true,
                composed: true,
              }),
            );
          }}
        />
      </ThemeProvider>,
    );
  }
}

/**
 * Registers the embed widget custom element once per page.
 */
export function registerEmbedWidget() {
  if (!customElements.get(EMBED_WIDGET_TAG_NAME)) {
    customElements.define(EMBED_WIDGET_TAG_NAME, EmbedWidget);
  }
}
