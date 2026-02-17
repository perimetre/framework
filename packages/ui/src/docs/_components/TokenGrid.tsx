import { useEffect, useState } from 'react';

type Token = {
  name: string;
  value: string;
};

type TokenCategory = {
  label: string;
  tokens: Token[];
};

/**
 * Displays all design tokens from the active brand in an organized grid format.
 */
export function TokenGrid() {
  const [categories, setCategories] = useState<TokenCategory[]>([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Small delay to let stylesheets finish loading
    const timer = setTimeout(() => {
      const tokens = collectTokens();
      setCount(tokens.length);
      setCategories(categorize(tokens));
    }, 100);
    return () => {
      clearTimeout(timer);
    };
  }, []);

  if (categories.length === 0) {
    return <p>Loading tokens...</p>;
  }

  return (
    <div>
      <p
        style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '2rem' }}
      >
        {count} tokens discovered from the active brand's stylesheets. Switch
        brands using the Ladle toolbar to see how values change.
      </p>
      {categories.map((cat) => (
        <CategorySection key={cat.label} category={cat} />
      ))}
    </div>
  );
}

/**
 * Groups tokens into categories based on their naming patterns and prefixes.
 */
function categorize(tokens: Token[]): TokenCategory[] {
  const buckets: Record<string, Token[]> = {};

  const categoryOrder = [
    'Primitive Colors',
    'Semantic Colors — Background',
    'Semantic Colors — Surface',
    'Semantic Colors — Foreground',
    'Semantic Colors — Border',
    'Semantic Colors — Interactive',
    'Semantic Colors — Button',
    'Semantic Colors — Input',
    'Semantic Colors — Form Controls',
    'Semantic Colors — Feedback',
    'Semantic Colors — AlertBar',
    'Semantic Colors — Dropdown',
    'Semantic Colors — Table',
    'Shape — Radius',
    'Shape — Border Width',
    'Elevation — Shadows',
    'Typography — Styles',
    'Typography — Field Label',
    'Typography — Primitives',
    'Motion',
    'Other'
  ];

  for (const cat of categoryOrder) buckets[cat] = [];

  for (const t of tokens) {
    const n = t.name;

    if (n.startsWith('--pui-primitive-color-'))
      buckets['Primitive Colors'].push(t);
    else if (n.startsWith('--pui-color-bg-'))
      buckets['Semantic Colors — Background'].push(t);
    else if (n.startsWith('--pui-color-surface-'))
      buckets['Semantic Colors — Surface'].push(t);
    else if (n.startsWith('--pui-color-fg-'))
      buckets['Semantic Colors — Foreground'].push(t);
    else if (n.startsWith('--pui-color-border-'))
      buckets['Semantic Colors — Border'].push(t);
    else if (n.startsWith('--pui-color-interactive-'))
      buckets['Semantic Colors — Interactive'].push(t);
    else if (n.startsWith('--pui-color-button-'))
      buckets['Semantic Colors — Button'].push(t);
    else if (n.startsWith('--pui-color-input-'))
      buckets['Semantic Colors — Input'].push(t);
    else if (n.startsWith('--pui-color-control-'))
      buckets['Semantic Colors — Form Controls'].push(t);
    else if (n.startsWith('--pui-color-feedback-'))
      buckets['Semantic Colors — Feedback'].push(t);
    else if (n.startsWith('--pui-color-alertbar-'))
      buckets['Semantic Colors — AlertBar'].push(t);
    else if (n.startsWith('--pui-color-dropdown-'))
      buckets['Semantic Colors — Dropdown'].push(t);
    else if (n.startsWith('--pui-color-table-'))
      buckets['Semantic Colors — Table'].push(t);
    else if (n.includes('-radius-') || n.includes('-radius:'))
      buckets['Shape — Radius'].push(t);
    else if (n.includes('-border-width'))
      buckets['Shape — Border Width'].push(t);
    else if (n.includes('-shadow-')) buckets['Elevation — Shadows'].push(t);
    else if (n.startsWith('--pui-typo-'))
      buckets['Typography — Styles'].push(t);
    else if (n.startsWith('--pui-field-label-'))
      buckets['Typography — Field Label'].push(t);
    else if (
      n.startsWith('--pui-primitive-font-') ||
      n.startsWith('--pui-primitive-leading-')
    )
      buckets['Typography — Primitives'].push(t);
    else if (n.includes('-duration-')) buckets.Motion.push(t);
    else buckets.Other.push(t);
  }

  return categoryOrder
    .filter((cat) => buckets[cat].length > 0)
    .map((cat) => ({ label: cat, tokens: buckets[cat] }));
}

/**
 * Renders a category section with tokens displayed in an appropriate format based on their type.
 */
function CategorySection({ category }: { category: TokenCategory }) {
  const isTypoStyles = category.label === 'Typography — Styles';

  if (isTypoStyles) {
    const groups = groupTypoStyles(category.tokens);
    return (
      <div style={{ marginBottom: '2.5rem' }}>
        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            marginBottom: '1rem',
            borderBottom: '2px solid #e2e8f0',
            paddingBottom: '0.5rem'
          }}
        >
          {category.label}
        </h2>
        {Object.entries(groups).map(([style, tokens]) => (
          <TypoStyleRow key={style} style={style} tokens={tokens} />
        ))}
      </div>
    );
  }

  const hasColors = category.tokens.some(isColorToken);
  const hasRadii = category.tokens.some(isRadiusToken);
  const hasShadows = category.tokens.some(isShadowToken);

  return (
    <div style={{ marginBottom: '2.5rem' }}>
      <h2
        style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          marginBottom: '1rem',
          borderBottom: '2px solid #e2e8f0',
          paddingBottom: '0.5rem'
        }}
      >
        {category.label}
        <span
          style={{
            fontSize: '0.8125rem',
            fontWeight: 400,
            color: '#94a3b8',
            marginLeft: '0.5rem'
          }}
        >
          ({category.tokens.length})
        </span>
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            hasColors || hasRadii || hasShadows
              ? 'repeat(auto-fill, minmax(18rem, 1fr))'
              : '1fr',
          gap: hasColors || hasRadii || hasShadows ? '0.25rem 2rem' : '0'
        }}
      >
        {category.tokens.map((t) => {
          if (isColorToken(t)) return <ColorSwatch key={t.name} token={t} />;
          if (isRadiusToken(t)) return <RadiusSwatch key={t.name} token={t} />;
          if (isShadowToken(t)) return <ShadowSwatch key={t.name} token={t} />;
          return <GenericRow key={t.name} token={t} />;
        })}
      </div>
    </div>
  );
}

/**
 * Scans all loaded stylesheets for CSS custom properties matching `--pui-`
 * and reads their computed values from the nearest `[data-pui-brand]` element.
 * This means the grid automatically reflects the active brand and updates
 * when new tokens are added — no manual maintenance required.
 */
function collectTokens(): Token[] {
  const brandEl = document.querySelector('[data-pui-brand]');
  if (!brandEl) return [];

  const computed = getComputedStyle(brandEl);
  const seen = new Set<string>();
  const tokens: Token[] = [];

  try {
    for (const sheet of Array.from(document.styleSheets)) {
      let rules: CSSRuleList;
      try {
        rules = sheet.cssRules;
      } catch {
        continue; // skip cross-origin sheets
      }

      /**
       * Recursively walks through CSS rules to find custom properties.
       */
      const walk = (ruleList: CSSRuleList) => {
        for (const rule of Array.from(ruleList)) {
          // Recurse into nested rules (@layer, @media, etc.)
          // Cast needed: CSSRule base type doesn't declare cssRules, but
          // CSSGroupingRule / CSSLayerBlockRule subtypes have it at runtime.
          const groupRule = rule as { cssRules?: CSSRuleList } & CSSRule;
          if (groupRule.cssRules) {
            walk(groupRule.cssRules);
          }
          if (rule instanceof CSSStyleRule) {
            for (const prop of Array.from(rule.style)) {
              if (prop.startsWith('--pui-') && !seen.has(prop)) {
                seen.add(prop);
                const value = computed.getPropertyValue(prop).trim();
                if (value) {
                  tokens.push({ name: prop, value });
                }
              }
            }
          }
        }
      };
      walk(rules);
    }
  } catch {
    // Fallback silently
  }

  return tokens.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Displays a color token with a visual swatch and its value.
 */
function ColorSwatch({ token }: { token: Token }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.375rem 0'
      }}
    >
      <div
        style={{
          width: '2.5rem',
          height: '2.5rem',
          borderRadius: '0.375rem',
          backgroundColor: `var(${token.name})`,
          border: '1px solid rgba(0,0,0,0.1)',
          flexShrink: 0
        }}
      />
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            fontFamily: 'monospace'
          }}
        >
          {shortName(token.name)}
        </div>
        <div
          style={{
            fontSize: '0.75rem',
            color: '#666',
            fontFamily: 'monospace'
          }}
        >
          {token.value}
        </div>
      </div>
    </div>
  );
}

/**
 * Displays a generic token in a simple row format with name and value.
 */
function GenericRow({ token }: { token: Token }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0.375rem 0',
        borderBottom: '1px solid #f1f5f9',
        gap: '1rem'
      }}
    >
      <span
        style={{
          fontSize: '0.8125rem',
          fontWeight: 600,
          fontFamily: 'monospace'
        }}
      >
        {shortName(token.name)}
      </span>
      <span
        style={{
          fontSize: '0.75rem',
          color: '#666',
          fontFamily: 'monospace',
          textAlign: 'right'
        }}
      >
        {token.value}
      </span>
    </div>
  );
}

/** Group typography tokens by style name (e.g. heading-1, button, base) */
function groupTypoStyles(tokens: Token[]): Record<string, Token[]> {
  const groups: Record<string, Token[]> = {};
  for (const t of tokens) {
    // --pui-typo-{style}-{property}
    const match =
      /^--pui-typo-(.+)-(size|leading|weight|tracking|transform)$/.exec(t.name);
    if (match) {
      const style = match[1];
      groups[style] ??= [];
      groups[style].push(t);
    }
  }
  return groups;
}

// ---- Render components ----

/**
 * Determines if a token represents a color value.
 */
function isColorToken(token: Token): boolean {
  const n = token.name;
  const v = token.value;
  return (
    n.includes('-color-') ||
    n.startsWith('--pui-color-') ||
    v.startsWith('#') ||
    v.startsWith('rgb') ||
    v.startsWith('hsl') ||
    v.startsWith('oklch')
  );
}

/**
 * Determines if a token represents a border radius value.
 */
function isRadiusToken(token: Token): boolean {
  return token.name.includes('-radius-');
}

/**
 * Determines if a token represents a shadow value.
 */
function isShadowToken(token: Token): boolean {
  return token.name.includes('-shadow-');
}

/**
 * Displays a border radius token with a visual preview and its value.
 */
function RadiusSwatch({ token }: { token: Token }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.375rem 0'
      }}
    >
      <div
        style={{
          width: '2.5rem',
          height: '2.5rem',
          borderRadius: `var(${token.name})`,
          backgroundColor: '#e2e8f0',
          border: '2px solid #94a3b8',
          flexShrink: 0
        }}
      />
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            fontFamily: 'monospace'
          }}
        >
          {shortName(token.name)}
        </div>
        <div
          style={{
            fontSize: '0.75rem',
            color: '#666',
            fontFamily: 'monospace'
          }}
        >
          {token.value}
        </div>
      </div>
    </div>
  );
}

/**
 * Displays a shadow token with a visual preview and its value.
 */
function ShadowSwatch({ token }: { token: Token }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.5rem 0'
      }}
    >
      <div
        style={{
          width: '3rem',
          height: '3rem',
          borderRadius: '0.375rem',
          backgroundColor: '#fff',
          boxShadow: `var(${token.name})`,
          flexShrink: 0
        }}
      />
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            fontFamily: 'monospace'
          }}
        >
          {shortName(token.name)}
        </div>
        <div
          style={{
            fontSize: '0.75rem',
            color: '#666',
            fontFamily: 'monospace',
            maxWidth: '20rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {token.value}
        </div>
      </div>
    </div>
  );
}

/**
 * Removes common prefixes from token names for cleaner display.
 */
function shortName(name: string): string {
  return name.replace('--pui-', '').replace('primitive-', 'p/');
}

/**
 * Displays a typography style with a live preview and all its property values.
 */
function TypoStyleRow({ style, tokens }: { style: string; tokens: Token[] }) {
  const props: Record<string, string> = {};
  for (const t of tokens) {
    const parts = t.name.split('-');
    const prop = parts[parts.length - 1];
    props[prop] = t.value;
  }

  return (
    <div style={{ padding: '0.75rem 0', borderBottom: '1px solid #e5e7eb' }}>
      <div
        style={{
          fontSize: `var(--pui-typo-${style}-size, 1rem)`,
          lineHeight: `var(--pui-typo-${style}-leading, 1.5)`,
          fontWeight:
            `var(--pui-typo-${style}-weight, 400)` as unknown as number,
          letterSpacing: `var(--pui-typo-${style}-tracking, 0)`,
          textTransform:
            `var(--pui-typo-${style}-transform, none)` as React.CSSProperties['textTransform']
        }}
      >
        {style}
      </div>
      <div
        style={{
          fontSize: '0.75rem',
          color: '#666',
          fontFamily: 'monospace',
          marginTop: '0.25rem'
        }}
      >
        {Object.entries(props)
          .map(([k, v]) => `${k}: ${v}`)
          .join(' · ')}
      </div>
    </div>
  );
}
