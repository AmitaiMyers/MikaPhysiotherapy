/**
 * Renders a picture of every bone and joint, highlighted on the skeleton (run after build-model.mjs):
 *
 *   node scripts/anatomy/render-bones.mjs
 *
 * For each bone (and each joint's bones together) it picks the view that shows most of it, writes
 * a large image and a thumbnail to public/images/bones/ and public/images/joints/, and lists them
 * in src/data/generated/boneImages.json.
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const MANIFEST = join(ROOT, 'src', 'data', 'generated', 'boneImages.json');
const IMAGE = { width: 800, height: 1000, padding: 1.9 };
const THUMB = { width: 240, height: 240, padding: 1.25 };
const VIEWS = ['anterior', 'posterior', 'lateral', 'medial'];
/** Front and back read most easily, then the outer side; the view from the inner side is a last resort. */
const VIEW_WEIGHT = { anterior: 1.25, posterior: 1.25, lateral: 1, medial: 0.7 };
/** Joints of a whole region are pictured whole; the others zoom in on where their bones meet. */
const WHOLE_JOINTS = new Set(['cervical-spine', 'trunk', 'pelvis', 'pelvic-floor', 'thorax', 'scapulothoracic', 'face', 'hyoid', 'finger-pip', 'finger-dip', 'thumb-ip', 'hallux-ip', 'toe-ip']);

function writeDataUrl(path, dataUrl) {
  const prefix = 'data:image/webp;base64,';
  if (!dataUrl.startsWith(prefix)) throw new Error(`Renderer did not return WebP for ${path}`);
  writeFileSync(path, Buffer.from(dataUrl.slice(prefix.length), 'base64'));
}

const server = await createServer({ root: ROOT, logLevel: 'error', server: { port: 5197, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
try {
  const page = await browser.newPage({ viewport: { width: 1000, height: 1000 } });
  page.on('pageerror', (error) => console.error('Page error:', error.message));
  await page.goto(`http://localhost:5197${server.config.base}scripts/anatomy/render-bones.html`);
  await page.waitForFunction(() => 'boneTool' in window, null, { timeout: 180_000 });
  const available = new Set(await page.evaluate(() => window.boneTool.boneIds));
  const { BONES, JOINTS } = await server.ssrLoadModule('/src/data/index.ts');

  const render = async (kind, id, boneIds, focus) => {
    const scores = [];
    for (const view of VIEWS) {
      const coverage = await page.evaluate(({ boneIds, focus, view }) => window.boneTool.coverage(boneIds, focus, view), { boneIds, focus, view });
      scores.push({ view, score: coverage * VIEW_WEIGHT[view] });
    }
    scores.sort((a, b) => b.score - a.score);
    const view = scores[0].view;
    const dir = join(ROOT, 'public', 'images', kind);
    writeDataUrl(join(dir, `${id}.webp`), await page.evaluate((r) => window.boneTool.image(r.boneIds, r.focus, r.view, r.width, r.height, r.padding), { boneIds, focus, view, ...IMAGE }));
    writeDataUrl(join(dir, `${id}-thumb.webp`), await page.evaluate((r) => window.boneTool.image(r.boneIds, r.focus, r.view, r.width, r.height, r.padding), { boneIds, focus, view, ...THUMB }));
    console.log(`${kind.padEnd(6)} ${id.padEnd(28)} ${view}`);
    return view;
  };

  const manifest = { bones: {}, joints: {} };
  for (const kind of ['bones', 'joints']) {
    rmSync(join(ROOT, 'public', 'images', kind), { recursive: true, force: true });
    mkdirSync(join(ROOT, 'public', 'images', kind), { recursive: true });
  }
  for (const bone of BONES) {
    if (!available.has(bone.id)) {
      console.log(`bones  ${bone.id.padEnd(28)} (no mesh — skipped)`);
      continue;
    }
    manifest.bones[bone.id] = await render('bones', bone.id, [bone.id], 'whole');
  }
  for (const joint of JOINTS) {
    const boneIds = joint.bones.filter((id) => available.has(id));
    if (boneIds.length === 0) {
      console.log(`joints ${joint.id.padEnd(28)} (no bone mesh — skipped)`);
      continue;
    }
    manifest.joints[joint.id] = await render('joints', joint.id, boneIds, WHOLE_JOINTS.has(joint.id) ? 'whole' : 'contact');
  }
  writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 1)}\n`);
} finally {
  await browser.close();
  await server.close();
}
