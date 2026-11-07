// UI quality gate: opens key screens at phone size in light and dark, saves screenshots, and fails
// on console errors or serious accessibility issues (axe). Needs the app served, e.g.
//   npm run build && npx vite preview --port 4180 &
//   node scripts/ui-check.mjs http://localhost:4180/MikaPhysiotherapy/ ./ui-check
import { AxeBuilder } from '@axe-core/playwright';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const [base = 'http://localhost:4180/MikaPhysiotherapy/', out = 'ui-check', only = ''] = process.argv.slice(2);

const SCREENS = {
  home: ['/', '/search?q=deltoid', '/search'],
  library: ['/muscles', '/muscles/deltoid', '/muscles/deltoid?tab=techniques', '/bones', '/bones/talus', '/joints/knee', '/nerves', '/nerves/median', '/tests', '/tests/empty-can'],
  rehab: ['/rehab', '/rehab/exercises/bridge', '/rehab/protocols', '/rehab/protocols/tka', '/rehab/programmes', '/techniques', '/techniques?view=condition', '/techniques/dn-upper-trapezius', '/techniques/families/mulligan', '/techniques/conditions/neck-pain', '/techniques/new'],
  patients: ['/patients'],
  calendar: ['/calendar'],
};

const paths = only === '' ? Object.values(SCREENS).flat() : SCREENS[only];
if (paths === undefined) throw new Error(`Unknown journey "${only}"`);
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const problems = [];
for (const scheme of ['light', 'dark']) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: scheme, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.on('pageerror', (error) => problems.push(`${scheme} page error: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error' && !/youtube|ytimg|ERR_|Failed to load resource/.test(message.text())) problems.push(`${scheme} console: ${message.text()}`);
  });
  for (const path of paths) {
    await page.goto(`${base}#${path}`);
    await page.waitForTimeout(500);
    const name = `${path === '/' ? 'home' : path.replace(/[/?=&]+/g, '_').replace(/^_/, '')}-${scheme}`;
    await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    for (const violation of result.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')) {
      problems.push(`${scheme} ${path}: ${violation.id} — ${violation.help} (${violation.nodes.length}) e.g. ${violation.nodes[0]?.target.join(' ')}`);
    }
  }
  await context.close();
}
await browser.close();
console.log(problems.length === 0 ? `UI check passed: ${paths.length} screens × 2 themes.` : problems.join('\n'));
process.exit(problems.length === 0 ? 0 : 1);
