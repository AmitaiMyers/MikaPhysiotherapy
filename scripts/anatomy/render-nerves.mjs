/**
 * Renders a picture of every peripheral nerve (run after build-model.mjs):
 *
 *   node scripts/anatomy/render-nerves.mjs
 *
 * Downloads the pinned Z-Anatomy nervous system (cached), then for each nerve picks the view that
 * shows most of it and writes a large image and a thumbnail to public/images/nerves/, listed in
 * src/data/generated/nerveImages.json with whether the nerve itself is in the model.
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { NERVE_SOURCE } from './config.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SOURCE = join(ROOT, 'scripts', 'anatomy', '.cache', NERVE_SOURCE.file);
const OUT = join(ROOT, 'public', 'images', 'nerves');
const MANIFEST = join(ROOT, 'src', 'data', 'generated', 'nerveImages.json');
const IMAGE = { width: 800, height: 1000, padding: 1.25 };
const THUMB = { width: 240, height: 240, padding: 1.1 };
const VIEWS = ['anterior', 'posterior', 'lateral', 'medial'];
/** Front and back read most easily, then the outer side; the view from the inner side is a last resort. */
const VIEW_WEIGHT = { anterior: 1.25, posterior: 1.25, lateral: 1, medial: 0.7 };
/** Nerves of the sole are seen from below (scoring would pick that view for long limb nerves too, looking along the limb); the hypoglossal nerve shows best from the side, below the jaw. */
const FIXED_VIEW = { 'medial-plantar': 'inferior', 'lateral-plantar': 'inferior', 'c1-via-hypoglossal': 'lateral' };

function writeDataUrl(path, dataUrl) {
  const prefix = 'data:image/webp;base64,';
  if (!dataUrl.startsWith(prefix)) throw new Error(`Renderer did not return WebP for ${path}`);
  writeFileSync(path, Buffer.from(dataUrl.slice(prefix.length), 'base64'));
}

if (!existsSync(SOURCE)) {
  console.log(`Downloading ${NERVE_SOURCE.url}`);
  const response = await fetch(NERVE_SOURCE.url);
  if (!response.ok) throw new Error(`Download failed (${response.status}): ${NERVE_SOURCE.url}`);
  mkdirSync(dirname(SOURCE), { recursive: true });
  writeFileSync(SOURCE, Buffer.from(await response.arrayBuffer()));
}

/** The view that shows most of the nerve (or of its muscles, when the nerve is not in the model). */
async function bestView(id, muscleIds) {
  const scores = [];
  for (const view of VIEWS) {
    const coverage = await page.evaluate((r) => window.nerveTool.coverage(r.id, r.muscleIds, r.view), { id, muscleIds, view });
    scores.push({ view, score: coverage * VIEW_WEIGHT[view] });
  }
  scores.sort((a, b) => b.score - a.score);
  return scores[0].view;
}

const server = await createServer({ root: ROOT, logLevel: 'error', server: { port: 5198, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1000, height: 1000 } });
try {
  page.on('pageerror', (error) => console.error('Page error:', error.message));
  await page.route('**/NervousSystem100.fbx', (route) => route.fulfill({ body: readFileSync(SOURCE), contentType: 'application/octet-stream' }));
  await page.goto(`http://localhost:5198${server.config.base}scripts/anatomy/render-nerves.html`);
  await page.waitForFunction(() => 'nerveTool' in window, null, { timeout: 300_000 });
  const { NERVES } = await server.ssrLoadModule('/src/data/index.ts');
  const { musclesSuppliedBy, musclesSuppliedViaBranches } = await server.ssrLoadModule('/src/domain/relations.ts');

  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  const manifest = {};
  for (const nerve of NERVES) {
    const muscleIds = [...musclesSuppliedBy(nerve.id), ...musclesSuppliedViaBranches(nerve.id)].map((m) => m.id);
    if (!(await page.evaluate((r) => window.nerveTool.drawable(r.id, r.muscleIds), { id: nerve.id, muscleIds }))) {
      console.log(`${nerve.id.padEnd(30)} (neither the nerve nor its muscles are in the model — skipped)`);
      continue;
    }
    const view = nerve.id in FIXED_VIEW ? FIXED_VIEW[nerve.id] : await bestView(nerve.id, muscleIds);
    for (const [suffix, size] of [['', IMAGE], ['-thumb', THUMB]]) {
      const dataUrl = await page.evaluate((r) => window.nerveTool.image(r.id, r.muscleIds, r.view, r.width, r.height, r.padding), { id: nerve.id, muscleIds, view, ...size });
      writeDataUrl(join(OUT, `${nerve.id}${suffix}.webp`), dataUrl);
    }
    const drawn = await page.evaluate((id) => window.nerveTool.drawn(id), nerve.id);
    manifest[nerve.id] = { view, drawn };
    console.log(`${nerve.id.padEnd(30)} ${view.padEnd(10)} ${drawn ? '' : '(muscles only)'}`);
  }
  writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 1)}\n`);
} finally {
  await browser.close();
  await server.close();
}
