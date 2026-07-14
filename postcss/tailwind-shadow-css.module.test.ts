import { describe, expect, it } from 'vitest';

import { normalizeTailwindShadowCss } from './tailwind-shadow-css.module';

const TAILWIND_PROPERTY_FIXTURE = `
@layer properties {
  @supports (((-webkit-hyphens: none)) and (not (margin-trim: inline))) or ((-moz-orient: inline) and (not (color:rgb(from red r g b)))) {
    *, :before, :after, ::backdrop {
      --tw-shadow: 0 0 #0000;
      --tw-border-style: solid;
    }
  }
}

@property --tw-shadow {
  syntax: "*";
  inherits: false;
  initial-value: 0 0 #0000;
}

@property --tw-border-style {
  syntax: "*";
  inherits: false;
  initial-value: solid;
}

@property --unrelated {
  syntax: "*";
  inherits: true;
  initial-value: none;
}

.shadow-lg {
  --tw-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
`;

describe('normalizeTailwindShadowCss', () => {
  it('expands Tailwind fallback selectors with :host and related pseudos', () => {
    const result = normalizeTailwindShadowCss(TAILWIND_PROPERTY_FIXTURE);

    expect(result).toContain(':host');
    expect(result).toContain(':host::before');
    expect(result).toContain(':host::after');
    expect(result).toContain('::file-selector-button');
  });

  it('materializes --tw-* fallbacks under @layer properties', () => {
    const result = normalizeTailwindShadowCss(TAILWIND_PROPERTY_FIXTURE);

    expect(result).toMatch(/@layer\s+properties/);
    expect(result).toContain('--tw-shadow:');
    expect(result).toContain('--tw-border-style:');
  });

  it('ignores non-Tailwind @property rules that inherit', () => {
    const result = normalizeTailwindShadowCss(TAILWIND_PROPERTY_FIXTURE);

    expect(result).not.toMatch(
      /:host[\s\S]*--unrelated\s*:/,
    );
  });

  it('is idempotent across repeated passes', () => {
    const once = normalizeTailwindShadowCss(TAILWIND_PROPERTY_FIXTURE);
    const twice = normalizeTailwindShadowCss(once);

    expect(twice).toBe(once);
  });

  it('returns input unchanged when no Tailwind --tw-* defaults exist', () => {
    const css = '.btn { color: blue; }';

    expect(normalizeTailwindShadowCss(css)).toBe(css);
  });

  it('ensures a top-level @layer properties fallback when only @property exists', () => {
    const css = `
@property --tw-rotate-x {
  syntax: "*";
  inherits: false;
  initial-value: rotateX(0);
}
`;

    const result = normalizeTailwindShadowCss(css);

    expect(result).toMatch(/@layer\s+properties/);
    expect(result).toContain(':host');
    expect(result).toContain('--tw-rotate-x: rotateX(0)');
  });
});
