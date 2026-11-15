/**
 * Renders the pictures of every ligament, capsule, meniscus and disc (run after build-ligaments.mjs):
 *
 *   node scripts/anatomy/render-ligaments.mjs              # all regions
 *   node scripts/anatomy/render-ligaments.mjs lower-limb   # only the given region(s); others are kept
 *
 * For each structure it measures how much of it shows from each side, keeps the 1–3 most informative
 * views and a thumbnail, and writes src/data/generated/ligamentImages.json. When bone or capsule hides
 * most of a structure from every side, its pictures show the bones see-through ("xray").
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const IMAGE_DIR = join(ROOT, 'public', 'images', 'ligaments');
const MANIFEST = join(ROOT, 'src', 'data', 'generated', 'ligamentImages.json');
const IMAGE = { width: 800, height: 1000, padding: 1.7 };
const THUMB = { width: 240, height: 240, padding: 1.25 };
/** Every structure gets its best view; up to two more are kept when they show at least this share of the best. */
const MAX_VIEWS = 3;
const KEEP_RATIO = 0.4;
/** Below this share of the structure visible in its best view, the bones are drawn see-through. */
const XRAY_BELOW = 0.35;
/** Front and back read most easily, then the outer side; the inner side, below and above are last resorts. */
const VIEW_WEIGHT = { anterior: 1.2, posterior: 1.2, lateral: 1, medial: 0.85, inferior: 0.9, superior: 0.9 };

/** Views worth trying for a structure: limbs from all sides, the foot also from below and above; trunk and head without the inner side. */
function candidateViews(ligament) {
  if (ligament.groupId === 'midfoot' || ligament.groupId === 'forefoot') return ['anterior', 'lateral', 'medial', 'inferior', 'superior'];
  if (ligament.regionId === 'upper-limb' || ligament.regionId === 'lower-limb') return ['anterior', 'posterior', 'lateral', 'medial'];
  return ['anterior', 'posterior', 'lateral'];
}

function writeDataUrl(path, dataUrl) {
  const prefix = 'data:image/webp;base64,';
  if (!dataUrl.startsWith(prefix)) throw new Error(`Renderer did not return WebP for ${path}`);
  writeFileSync(path, Buffer.from(dataUrl.slice(prefix.length), 'base64'));
}

function removeImages(id) {
  const pattern = new RegExp(`^${id}-(anterior|posterior|lateral|medial|inferior|superior|thumb)\\.webp$`);
  for (const file of readdirSync(IMAGE_DIR)) if (pattern.test(file)) rmSync(join(IMAGE_DIR, file));
}

async function renderLigament(page, ligament) {
  const scored = [];
  for (const view of candidateViews(ligament)) {
    const { visible, alone } = await page.evaluate((r) => window.ligamentTool.measure(r.id, r.view), { id: ligament.id, view });
    scored.push({ view, visible: visible * VIEW_WEIGHT[view], alone: alone * VIEW_WEIGHT[view] });
  }
  const bestVisible = Math.max(...scored.map((s) => s.visible));
  const bestAlone = Math.max(...scored.map((s) => s.alone));
  const xray = bestVisible < bestAlone * XRAY_BELOW;
  // With see-through bones every side shows the whole structure; prefer the side where less bone is in front.
  const score = (s) => (xray ? s.alone + s.visible : s.visible);
  scored.sort((a, b) => score(b) - score(a));
  const best = score(scored[0]);
  const views = scored.filter((s, rank) => score(s) > 0 && (rank === 0 || score(s) >= best * KEEP_RATIO)).slice(0, MAX_VIEWS).map((s) => s.view);
  removeImages(ligament.id);
  const render = (view, size) => page.evaluate((r) => window.ligamentTool.image(r.id, r.view, r.width, r.height, r.padding, r.xray), { id: ligament.id, view, xray, ...size });
  for (const view of views) writeDataUrl(join(IMAGE_DIR, `${ligament.id}-${view}.webp`), await render(view, IMAGE));
  writeDataUrl(join(IMAGE_DIR, `${ligament.id}-thumb.webp`), await render(views[0], THUMB));
  console.log(`${ligament.id.padEnd(44)} ${views.join(', ').padEnd(32)}${xray ? 'see-through bones' : ''}`);
  return { views, xray };
}

const regions = process.argv.slice(2);
const server = await createServer({ root: ROOT, logLevel: 'error', server: { port: 5200, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1000, height: 1000 } });
try {
  page.on('pageerror', (error) => console.error('Page error:', error.message));
  await page.goto(`http://localhost:5200${server.config.base}scripts/anatomy/render-ligaments.html`);
  await page.waitForFunction(() => 'ligamentTool' in window, null, { timeout: 180_000 });
  const modelled = new Set(await page.evaluate(() => window.ligamentTool.ligamentIds));
  const { LIGAMENTS } = await server.ssrLoadModule('/src/data/ligaments/index.ts');
  mkdirSync(IMAGE_DIR, { recursive: true });
  const previous = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
  const manifest = regions.length === 0 ? {} : Object.fromEntries(Object.entries(previous).filter(([id]) => LIGAMENTS.some((l) => l.id === id && !regions.includes(l.regionId))));
  for (const ligament of LIGAMENTS) {
    if (regions.length > 0 && !regions.includes(ligament.regionId)) continue;
    if (!modelled.has(ligament.id)) {
      console.log(`${ligament.id.padEnd(44)} (not in the 3D atlas — no picture)`);
      continue;
    }
    manifest[ligament.id] = await renderLigament(page, ligament);
  }
  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(MANIFEST, `${JSON.stringify(sorted, null, 1)}\n`);
} finally {
  await browser.close();
  await server.close();
}
