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
  library: ['/muscles', '/muscles/deltoid', '/muscles/deltoid?tab=techniques', '/bones', '/bones/talus', '/joints/knee', '/nerves', '/nerves?q=C5', '/nerves/median', '/nerves/phrenic', '/tests', '/tests/empty-can'],
  rehab: ['/rehab', '/rehab/exercises/bridge', '/rehab/protocols', '/rehab/protocols/tka', '/rehab/programmes', '/techniques', '/techniques?view=condition', '/techniques/dn-upper-trapezius', '/techniques/dn-pectineus', '/techniques/families/mulligan', '/techniques/conditions/neck-pain', '/techniques/new'],
  patients: ['/patients', '/patients/{patient}', '/patients/{patient}/episodes/{episode}', '/patients/sessions/{session}', '/patients/{patient}/progress', '/patients/templates', '/patients/settings'],
  calendar: ['/calendar', '/calendar?view=week', '/calendar/import'],
};

const NEEDS_VAULT = new Set(['patients', 'calendar', '']);

/** Create a vault with one patient, an episode with a care plan and a session; returns their ids. */
async function seedVault(page) {
  await page.goto(`${base}#/patients`);
  await page.getByLabel(/New PIN/).fill('246810');
  await page.getByLabel('Repeat the PIN').fill('246810');
  await page.getByRole('button', { name: 'Create PIN' }).click();
  await page.waitForTimeout(1500);
  await page.goto(`${base}#/patients/new`);
  await page.getByLabel('First name').fill('Dana');
  await page.getByRole('button', { name: /Save|Create/ }).first().click();
  await page.waitForTimeout(500);
  const patient = page.url().split('/patients/')[1];
  await page.goto(`${base}#/patients/${patient}/episodes/new`);
  await page.getByLabel('Title').fill('Right neck pain');
  await page.getByLabel('Search techniques to add').fill('cervical snag');
  await page.getByRole('button', { name: /Cervical SNAG \(rotation/ }).click();
  await page.getByRole('button', { name: 'Create episode' }).click();
  await page.waitForTimeout(500);
  const episodeLink = await page.locator('a[href*="/episodes/"]:not([href$="/new"])').first().getAttribute('href');
  const episode = episodeLink.split('/episodes/')[1];
  await page.goto(`${base}#/patients/${patient}/sessions/new`);
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: /Create|Book|Start|Plan/ }).last().click();
  await page.waitForTimeout(800);
  const session = page.url().split('/sessions/')[1];
  return { patient, episode, session };
}

const paths = only === '' ? Object.values(SCREENS).flat() : SCREENS[only];
if (paths === undefined) throw new Error(`Unknown journey "${only}"`);
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const problems = [];
for (const scheme of ['light', 'dark']) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: scheme, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const ids = NEEDS_VAULT.has(only) ? await seedVault(page) : {};
  const fill = (path) => path.replace(/\{(\w+)\}/g, (_, key) => ids[key]);
  page.on('pageerror', (error) => problems.push(`${scheme} page error: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error' && !/youtube|ytimg|ERR_|Failed to load resource/.test(message.text())) problems.push(`${scheme} console: ${message.text()}`);
  });
  for (const path of paths) {
    await page.goto(`${base}#${fill(path)}`);
    await page.waitForTimeout(500);
    const name = `${path === '/' ? 'home' : path.replace(/[{}]/g, '').replace(/[/?=&]+/g, '_').replace(/^_/, '')}-${scheme}`;
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
