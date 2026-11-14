/**
 * Works out the depth layer of every muscle in the 3D models (run after build-model.mjs):
 *
 *   node scripts/anatomy/muscle-depth.mjs
 *
 * Writes src/data/generated/muscleDepth.json (muscle id → layer, 0 = surface), which the 3D body
 * explorer uses to peel muscle layers.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'src', 'data', 'generated', 'muscleDepth.json');

const server = await createServer({ root: ROOT, logLevel: 'error', server: { port: 5199, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
try {
  const page = await browser.newPage({ viewport: { width: 800, height: 800 } });
  page.on('pageerror', (error) => console.error('Page error:', error.message));
  await page.goto(`http://localhost:5199${server.config.base}scripts/anatomy/muscle-depth.html`);
  await page.waitForFunction(() => 'depthTool' in window, null, { timeout: 180_000 });
  const layers = await page.evaluate(() => window.depthTool.layers());
  const sorted = Object.fromEntries(Object.entries(layers).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(OUT, `${JSON.stringify(sorted, null, 1)}\n`);
  const perLayer = {};
  for (const [id, layer] of Object.entries(sorted)) (perLayer[layer] ??= []).push(id);
  for (const [layer, ids] of Object.entries(perLayer)) console.log(`Layer ${layer} (${ids.length}): ${ids.join(', ')}`);
} finally {
  await browser.close();
  await server.close();
}
