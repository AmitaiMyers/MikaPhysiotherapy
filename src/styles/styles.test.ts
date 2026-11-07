import { describe, expect, it } from 'vitest';
import { buildTokensCss, type TokenFile } from './buildTokens';
import tokens from './tokens.json';

/** Every stylesheet's text, by path (Vite reads them; no Node file APIs needed). */
const SHEETS = import.meta.glob<string>('./**/*.css', { query: '?raw', import: 'default', eager: true });
const tokensCss = SHEETS['./tokens.css'] ?? '';
const others = Object.entries(SHEETS).filter(([path]) => path !== './tokens.css');

describe('design tokens', () => {
  it('tokens.css is generated from tokens.json (run `npm run tokens`)', () => {
    expect(tokensCss).toBe(buildTokensCss(tokens as unknown as TokenFile));
  });

  it('every colour, font size and duration outside tokens.css comes from a token', () => {
    const offending = others.flatMap(([path, text]) =>
      text
        .split('\n')
        .map((line, index) => ({ line, at: `${path}:${index + 1}` }))
        .filter(({ line }) => !line.includes('literal-ok'))
        .filter(({ line }) => /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i.test(line) || /font-size:\s*[\d.]+(px|rem|em)/.test(line) || /(transition|animation):[^;]*\b\d+(\.\d+)?m?s\b/.test(line.replace(/0\.8s linear infinite/, '')))
        .map(({ at, line }) => `${at} ${line.trim()}`),
    );
    expect(offending).toEqual([]);
  });

  it('uses only the spacing scale for padding, margin and gap', () => {
    const allowed = new Set(['0', '1px', '2px', '3px', 'auto']);
    const offending = others.flatMap(([path, text]) =>
      [...text.matchAll(/(?:padding|margin|gap)(?:-[a-z]+)?:\s*([^;]+);/g)].flatMap((match) =>
        (match[1] ?? '')
          .split(/\s+/)
          .filter((value) => /^\d/.test(value) && !allowed.has(value) && !value.endsWith('%') && !value.endsWith('em'))
          .map((value) => `${path}: ${value}`),
      ),
    );
    expect(offending).toEqual([]);
  });
});
