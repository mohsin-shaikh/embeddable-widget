import { createRoot, type Root } from 'react-dom/client';

import { EmbedWidgetComponent } from './components/embed-component';
import styles from './main.css?inline';

export const EMBED_WIDGET_TAG_NAME = 'embed-widget';

/**
 * Web Component that mounts the React widget inside an open Shadow Root with
 * inlined Tailwind styles (single embed.js asset for host pages).
 */
export class EmbedWidget extends HTMLElement {
  root: Root;
  rootContainer: ShadowRoot;

  constructor() {
    super();

    this.rootContainer = this.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = styles;
    style.setAttribute('type', 'text/css');
    this.rootContainer.appendChild(style);

    this.root = createRoot(this.rootContainer);
  }

  connectedCallback() {
    this.root.render(<EmbedWidgetComponent />);
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
