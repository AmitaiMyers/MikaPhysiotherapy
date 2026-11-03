/**
 * Renders the still images of every muscle from the 3D model (run after build-model.mjs):
 *
 *   node scripts/anatomy/render-images.mjs
 *
 * For each muscle it measures how much of the muscle is visible from the front, back and side,
 * keeps the 2–3 most informative views, renders one view of the origin/insertion areas and a
 * thumbnail, and writes src/data/generated/muscleImages.json for the app.
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const IMAGE_DIR = join(ROOT, 'public', 'images', 'muscles');
const MANIFEST = join(ROOT, 'src', 'data', 'generated', 'muscleImages.json');
const VIEWS = ['anterior', 'posterior', 'lateral'];
const IMAGE = { width: 800, height: 1000, padding: 1.3 };
const THUMB = { width: 240, height: 240, padding: 1.05 };
const MEASURE = { width: 200, height: 250, padding: 1.3 };
/** Every muscle gets the two best views; a third is kept when it shows at least this share of the best view. */
const MIN_VIEWS = 2;
const KEEP_RATIO = 0.45;

function writeDataUrl(path, dataUrl) {
  const prefix = 'data:image/webp;base64,';
  if (!dataUrl.startsWith(prefix)) throw new Error(`Renderer did not return WebP for ${path}`);
  writeFileSync(path, Buffer.from(dataUrl.slice(prefix.length), 'base64'));
}

async function main() {
  const server = await createServer({ root: ROOT, logLevel: 'error', server: { port: 5199, strictPort: true } });
  await server.listen();
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1000, height: 1000 } });
    page.on('pageerror', (error) => console.error('Page error:', error.message));
    await page.goto(`http://localhost:5199${server.config.base}scripts/anatomy/render.html`);
    await page.waitForFunction(() => 'renderTool' in window, null, { timeout: 120_000 });
    const muscleIds = await page.evaluate(() => window.renderTool.muscleIds);

    rmSync(IMAGE_DIR, { recursive: true, force: true });
    mkdirSync(IMAGE_DIR, { recursive: true });
    const manifest = {};
    for (const muscleId of muscleIds) {
      const measure = (view, mode) => page.evaluate((r) => window.renderTool.coverage(r), { muscleId, view, mode, ...MEASURE });
      const render = (view, mode, size) => page.evaluate((r) => window.renderTool.image(r), { muscleId, view, mode, ...size });

      const scored = [];
      for (const view of VIEWS) scored.push({ view, coverage: await measure(view, 'muscle') });
      scored.sort((a, b) => b.coverage - a.coverage);
      const best = scored[0].coverage;
      const views = scored.filter((s, rank) => rank < MIN_VIEWS || s.coverage >= best * KEEP_RATIO).map((s) => s.view);

      const attachmentScores = [];
      for (const view of VIEWS) attachmentScores.push({ view, coverage: await measure(view, 'attachments') });
      attachmentScores.sort((a, b) => b.coverage - a.coverage);
      const attachmentsView = attachmentScores[0].coverage > 0 ? attachmentScores[0].view : null;

      for (const view of views) writeDataUrl(join(IMAGE_DIR, `${muscleId}-${view}.webp`), await render(view, 'muscle', IMAGE));
      if (attachmentsView) writeDataUrl(join(IMAGE_DIR, `${muscleId}-attachments.webp`), await render(attachmentsView, 'attachments', IMAGE));
      writeDataUrl(join(IMAGE_DIR, `${muscleId}-thumb.webp`), await render(views[0], 'muscle', THUMB));

      manifest[muscleId] = { views, attachmentsView };
      console.log(`${muscleId.padEnd(34)} views: ${views.join(', ').padEnd(30)} attachments: ${attachmentsView ?? '—'}`);
    }
    mkdirSync(dirname(MANIFEST), { recursive: true });
    writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  } finally {
    await browser.close();
    await server.close();
  }
}

await main();
