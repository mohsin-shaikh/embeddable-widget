import postcss from 'postcss';

const TAILWIND_PROPERTY_NAME_PREFIX = '--tw-';
const TAILWIND_FALLBACK_SELECTORS = ['*', ':before', ':after'];
const TAILWIND_OPTIONAL_FALLBACK_SELECTORS = ['::backdrop', '::file-selector-button'];

/**
 * These selectors need explicit defaults inside the shadow tree because they
 * either represent the host itself or pseudo-elements that are not covered by
 * descendant-only matching.
 */
const SHADOW_FALLBACK_SELECTORS = [
  ':host',
  ':host::before',
  ':host::after',
  '*',
  ':before',
  ':after',
  '::backdrop',
  '::file-selector-button',
];

/**
 * Rewrites compiled Tailwind CSS so shadow-root consumers get concrete `--tw-*`
 * defaults even when `@property` registration behavior is not sufficient.
 */
export function normalizeTailwindShadowCss(css: string) {
  const root = postcss.parse(css, { from: 'tailwind-shadow.css' });
  const fallbackDeclarations = collectFallbackDeclarations(root);

  if (fallbackDeclarations.size === 0) {
    return css;
  }

  expandTailwindFallbackSelectors(root);
  ensureShadowFallbackRule(root, fallbackDeclarations);

  return root.toString();
}

/**
 * Exposes the same normalization as a PostCSS plugin so Vite can bake the
 * shadow-safe CSS into the inline bundle at build time.
 */
export function tailwindShadowCssPostcssPlugin() {
  return {
    postcssPlugin: 'tailwind-shadow-css',
    Once(root: postcss.Root) {
      const fallbackDeclarations = collectFallbackDeclarations(root);

      if (fallbackDeclarations.size === 0) {
        return;
      }

      expandTailwindFallbackSelectors(root);
      ensureShadowFallbackRule(root, fallbackDeclarations);
    },
  };
}

tailwindShadowCssPostcssPlugin.postcss = true;

/**
 * Tailwind already declares the initial values we need in `@property` rules.
 * We collect those declarations once and materialize them into ordinary CSS so
 * we can build declarations that work inside the shadow DOM.
 */
function collectFallbackDeclarations(root: postcss.Root) {
  const fallbackDeclarations = new Map<string, string>();

  root.walkAtRules('property', (atRule) => {
    const propertyName = atRule.params.trim();

    if (!propertyName.startsWith(TAILWIND_PROPERTY_NAME_PREFIX)) {
      return;
    }

    const initialValue = getTailwindPropertyInitialValue(atRule);

    if (initialValue !== undefined) {
      fallbackDeclarations.set(propertyName, initialValue);
    }
  });

  root.walkRules((rule) => {
    if (!isTailwindFallbackSelectorGroup(rule.selectors)) {
      return;
    }

    rule.walkDecls((declaration) => {
      if (!declaration.prop.startsWith(TAILWIND_PROPERTY_NAME_PREFIX)) {
        return;
      }

      fallbackDeclarations.set(declaration.prop, declaration.value);
    });
  });

  return fallbackDeclarations;
}

/**
 * Tailwind's built-in fallback reset targets the universal selector group.
 * Shadow-root usage also needs the host and a few special pseudo-elements to
 * participate in that same reset.
 */
function expandTailwindFallbackSelectors(root: postcss.Root) {
  root.walkRules((rule) => {
    if (!isTailwindFallbackSelectorGroup(rule.selectors)) {
      return;
    }

    if (!rule.nodes.some(isTailwindCustomPropertyDeclaration)) {
      return;
    }

    rule.selectors = SHADOW_FALLBACK_SELECTORS;
  });
}

/**
 * Ensures there is a host-scoped fallback rule in `@layer properties` even if
 * Tailwind only emitted nested feature-detected resets.
 */
function ensureShadowFallbackRule(root: postcss.Root, fallbackDeclarations: Map<string, string>) {
  const source = root.source;
  const existingRule: postcss.Rule | null = findShadowFallbackRule(root);

  if (existingRule) {
    for (const [propertyName, initialValue] of fallbackDeclarations) {
      if (
        !existingRule.nodes.some((node: postcss.ChildNode) =>
          isMatchingDeclaration(node, propertyName),
        )
      ) {
        existingRule.append(createDeclaration(propertyName, initialValue, source));
      }
    }

    return;
  }

  const fallbackRule = createRule(SHADOW_FALLBACK_SELECTORS.join(','), source);

  for (const [propertyName, initialValue] of fallbackDeclarations) {
    fallbackRule.append(createDeclaration(propertyName, initialValue, source));
  }

  const propertiesLayer = createLayerAtRule(source);

  propertiesLayer.append(fallbackRule);
  root.prepend(propertiesLayer);
}

/**
 * Reuses an existing shadow fallback rule when possible so the transform stays
 * idempotent across repeated PostCSS passes.
 */
function findShadowFallbackRule(root: postcss.Root): postcss.Rule | null {
  let matchingRule: postcss.Rule | null = null;

  root.walkRules((rule) => {
    if (matchingRule) {
      return;
    }

    if (!selectorsMatch(rule.selectors, SHADOW_FALLBACK_SELECTORS)) {
      return;
    }

    if (!isTopLevelPropertiesLayerRule(rule)) {
      return;
    }

    if (!rule.nodes.some(isTailwindCustomPropertyDeclaration)) {
      return;
    }

    matchingRule = rule;
  });

  return matchingRule;
}

/**
 * Selector order is not meaningful for this transform, so rule matching is
 * based on set equality rather than string equality.
 */
function selectorsMatch(actualSelectors: string[], expectedSelectors: string[]) {
  if (actualSelectors.length !== expectedSelectors.length) {
    return false;
  }

  const actualSelectorSet = new Set(actualSelectors.map((selector) => selector.trim()));

  return expectedSelectors.every((selector) => actualSelectorSet.has(selector));
}

function isTopLevelPropertiesLayerRule(rule: postcss.Rule) {
  return (
    rule.parent?.type === 'atrule' &&
    rule.parent.name === 'layer' &&
    rule.parent.params.trim() === 'properties'
  );
}

function isTailwindFallbackSelectorGroup(selectors: string[]) {
  const selectorSet = new Set(selectors.map((selector) => selector.trim()));

  if (!TAILWIND_FALLBACK_SELECTORS.every((selector) => selectorSet.has(selector))) {
    return false;
  }

  return [...selectorSet].every(
    (selector) =>
      TAILWIND_FALLBACK_SELECTORS.includes(selector) ||
      TAILWIND_OPTIONAL_FALLBACK_SELECTORS.includes(selector),
  );
}

function getTailwindPropertyInitialValue(atRule: postcss.AtRule) {
  let inheritsFalse = false;
  let initialValue: string | undefined;

  for (const node of atRule.nodes ?? []) {
    if (node.type !== 'decl') {
      continue;
    }

    if (node.prop === 'inherits' && node.value === 'false') {
      inheritsFalse = true;
    }

    if (node.prop === 'initial-value') {
      initialValue = node.value;
    }
  }

  if (!inheritsFalse) {
    return undefined;
  }

  return initialValue;
}

/**
 * We only expand rules that are actually initializing Tailwind custom
 * properties, not every rule that happens to share the same selector list.
 */
function isTailwindCustomPropertyDeclaration(node: postcss.ChildNode) {
  return node.type === 'decl' && node.prop.startsWith(TAILWIND_PROPERTY_NAME_PREFIX);
}

/**
 * Used when merging newly discovered defaults into an existing fallback rule.
 */
function isMatchingDeclaration(node: postcss.ChildNode, propertyName: string) {
  return node.type === 'decl' && node.prop === propertyName;
}

/**
 * Vite's downstream CSS pipeline relies on source metadata for importer-aware
 * rewrites, so injected declarations carry forward the root source.
 */
function createDeclaration(
  propertyName: string,
  initialValue: string,
  source: postcss.Source | undefined,
) {
  const declaration = postcss.decl({
    prop: propertyName,
    value: initialValue,
  });

  declaration.source = source;

  return declaration;
}

/**
 * Mirrors the source metadata on synthetic rules for the same reason as the
 * injected declarations.
 */
function createRule(selector: string, source: postcss.Source | undefined) {
  const rule = postcss.rule({ selector });

  rule.source = source;

  return rule;
}

/**
 * Keeps the synthetic `@layer properties` wrapper attributable to the original
 * stylesheet so later tooling treats it as part of the same asset.
 */
function createLayerAtRule(source: postcss.Source | undefined) {
  const atRule = postcss.atRule({ name: 'layer', params: 'properties' });

  atRule.source = source;

  return atRule;
}
