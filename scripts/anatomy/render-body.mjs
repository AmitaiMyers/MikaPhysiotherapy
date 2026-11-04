/**
 * Renders the interactive body of the home screen (run after build-model.mjs):
 *
 *   node scripts/anatomy/render-body.mjs
 *
 * Writes, for the front and back views and three layers (superficial muscles, deep muscles,
 * skeleton), a shaded WebP and a lossless PNG "ID map" to public/images/body/, plus
 * src/data/generated/bodyMap.json listing which muscle or bone each ID colour stands for.
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const IMAGE_DIR = join(ROOT, 'public', 'images', 'body');
const MANIFEST = join(ROOT, 'src', 'data', 'generated', 'bodyMap.json');
const SIZE = { width: 720, height: 1800 };
const VIEWS = ['front', 'back'];
const LAYERS = ['superficial', 'deep', 'skeleton'];

function writeDataUrl(path, dataUrl, mime) {
  const prefix = `data:${mime};base64,`;
  if (!dataUrl.startsWith(prefix)) throw new Error(`Renderer did not return ${mime} for ${path}`);
  writeFileSync(path, Buffer.from(dataUrl.slice(prefix.length), 'base64'));
}

const server = await createServer({ root: ROOT, logLevel: 'error', server: { port: 5198, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
try {
  const page = await browser.newPage({ viewport: { width: 1000, height: 1000 } });
  page.on('pageerror', (error) => console.error('Page error:', error.message));
  await page.goto(`http://localhost:5198${server.config.base}scripts/anatomy/render-body.html`);
  await page.waitForFunction(() => 'bodyTool' in window, null, { timeout: 180_000 });
  const superficial = await page.evaluate(({ width, height }) => window.bodyTool.superficialMuscles(width, height), SIZE);
  console.log(`${superficial.length} muscles peeled away for the deep layer`);
  rmSync(IMAGE_DIR, { recursive: true, force: true });
  mkdirSync(IMAGE_DIR, { recursive: true });
  const layers = {};
  for (const layer of LAYERS) {
    layers[layer] = {};
    for (const view of VIEWS) {
      const hidden = layer === 'deep' ? superficial : [];
      const result = await page.evaluate(({ view, layer, hidden, width, height }) => window.bodyTool.render(view, layer, hidden, width, height), { view, layer, hidden, ...SIZE });
      writeDataUrl(join(IMAGE_DIR, `${view}-${layer}.webp`), result.display, 'image/webp');
      writeDataUrl(join(IMAGE_DIR, `${view}-${layer}-ids.png`), result.ids, 'image/png');
      layers[layer][view] = result.present.sort((a, b) => a - b);
      console.log(`${view} ${layer}: ${result.present.length} structures`);
    }
  }
  const targets = await page.evaluate(() => window.bodyTool.targets);
  mkdirSync(dirname(MANIFEST), { recursive: true });
  writeFileSync(MANIFEST, `${JSON.stringify({ size: SIZE, targets, layers }, null, 1)}\n`);
} finally {
  await browser.close();
  await server.close();
}
