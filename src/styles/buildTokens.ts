/**
 * tokens.json (the design system's single source, shared with the published design system) →
 * tokens.css. Run `npm run tokens` after editing tokens.json; a test fails while they disagree.
 */
interface TokenEntry {
  name: string;
  value: string | Record<string, string>;
}

interface TypeStyle {
  name: string;
  fontSize: string;
  lineHeight: string;
  fontWeight: number;
  letterSpacing?: string;
}

export interface TokenFile {
  color: { themes: { id: string }[]; tokens: TokenEntry[] };
  type: { families: Record<string, string>; groups: { family: string; styles: TypeStyle[] }[] };
  [family: string]: unknown;
}

const PLAIN_FAMILIES = ['spacing', 'radius', 'size', 'duration', 'easing', 'zIndex'] as const;
const PER_THEME_FAMILIES = ['color', 'shadow'] as const;

const rem = (px: string): string => {
  const match = /^(\d+(?:\.\d+)?)px$/.exec(px);
  if (match === null) throw new Error(`Expected a px value, got "${px}"`);
  return `${Number(match[1]) / 16}rem`;
};

/** A value for one theme: aliases ("{accent}") become var(--accent). */
function themed(entry: TokenEntry, theme: string, firstTheme: string): string {
  const raw = typeof entry.value === 'string' ? entry.value : (entry.value[theme] ?? entry.value[firstTheme]);
  if (raw === undefined) throw new Error(`Token ${entry.name} has no value`);
  const alias = /^\{([\w.-]+)\}$/.exec(raw);
  return alias === null ? raw : `var(--${alias[1]})`;
}

function tokensOf(file: TokenFile, family: string): TokenEntry[] {
  const group = file[family] as { tokens: TokenEntry[] } | undefined;
  if (group === undefined) throw new Error(`tokens.json has no "${family}" family`);
  return group.tokens;
}

/** Legacy names kept while screens move to the new tokens. */
const ALIASES = [
  '--radius: var(--radius-md);',
  '--text-xs: var(--font-size-label);',
  '--text-sm: var(--font-size-callout);',
  '--text-md: var(--font-size-body);',
  '--text-lg: var(--font-size-title-2);',
  '--text-xl: var(--font-size-title-1);',
  '--text-2xl: var(--font-size-display);',
];

/** Values that are not design decisions: device insets and the gradients behind anatomy renders. */
const ENVIRONMENT = [
  '--safe-top: env(safe-area-inset-top, 0px);',
  '--safe-bottom: env(safe-area-inset-bottom, 0px);',
  '--image-bg: radial-gradient(circle at 50% 35%, #3a434a, #1c2226 75%);',
  '--stage-gradient: radial-gradient(120% 80% at 50% 20%, #33404a 0%, #1b2328 55%, #12181b 100%);',
];

export function buildTokensCss(file: TokenFile): string {
  const [first, ...others] = file.color.themes.map((t) => t.id);
  if (first === undefined) throw new Error('tokens.json has no theme');
  const themeBlock = (theme: string) => PER_THEME_FAMILIES.flatMap((family) => tokensOf(file, family).map((entry) => `--${entry.name}: ${themed(entry, theme, first)};`));
  const plain = PLAIN_FAMILIES.flatMap((family) => tokensOf(file, family).map((entry) => `--${entry.name}: ${String(entry.value)};`));
  const families = Object.entries(file.type.families).map(([key, stack]) => `--font-${key}: ${stack};`);
  const type = file.type.groups.flatMap((group) =>
    group.styles.flatMap((style) => [
      `--font-size-${style.name}: ${rem(style.fontSize)};`,
      `--line-height-${style.name}: ${rem(style.lineHeight)};`,
      `--font-weight-${style.name}: ${style.fontWeight};`,
      `--letter-spacing-${style.name}: ${style.letterSpacing ?? 'normal'};`,
      `--font-family-${style.name}: var(--font-${group.family});`,
    ]),
  );
  const indent = (lines: string[], depth: number) => lines.map((line) => `${'  '.repeat(depth)}${line}`).join('\n');
  const dark = others.map((theme) => `  @media (prefers-color-scheme: ${theme}) {\n    :root {\n      color-scheme: ${theme};\n${indent(themeBlock(theme), 3)}\n    }\n  }`);
  return [
    '/* Generated from tokens.json by `npm run tokens` — do not edit by hand. */',
    '@layer tokens {',
    '  :root {',
    '    color-scheme: light dark;',
    indent([...themeBlock(first), ...plain, ...families, ...type, ...ALIASES, ...ENVIRONMENT], 2),
    '  }',
    ...dark,
    '}',
    '',
  ].join('\n');
}
