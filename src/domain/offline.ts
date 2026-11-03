import { MUSCLES, REGIONS } from '../data';
import { attachmentImage, muscleViews } from '../data/images';
import { OFFLINE_CACHES } from '../offlineCaches';
import { modelUrls } from '../viewer/modelUrls';

interface OfflineItem {
  cacheName: string;
  url: string;
}

/** Every full-size image and 3D model file the app can show. */
function offlineItems(): OfflineItem[] {
  const images = MUSCLES.flatMap((m) => {
    const attachments = attachmentImage(m.id);
    return [...muscleViews(m.id), ...(attachments ? [attachments] : [])];
  }).map((image) => ({ cacheName: OFFLINE_CACHES.images, url: image.url }));
  const models = REGIONS.flatMap((region) => {
    const urls = modelUrls(region.id);
    return [urls.manifest, urls.geometry];
  }).map((url) => ({ cacheName: OFFLINE_CACHES.models, url }));
  return [...images, ...models];
}

export interface OfflineProgress {
  saved: number;
  total: number;
}

/** How many of the offline items are already in the caches. */
export async function offlineStatus(): Promise<OfflineProgress> {
  const items = offlineItems();
  let saved = 0;
  for (const item of items) {
    const cache = await caches.open(item.cacheName);
    if (await cache.match(item.url)) saved++;
  }
  return { saved, total: items.length };
}

/** Download every missing image and model into the service worker's caches. */
export async function saveEverythingOffline(onProgress: (progress: OfflineProgress) => void): Promise<void> {
  const items = offlineItems();
  let saved = 0;
  for (const item of items) {
    const cache = await caches.open(item.cacheName);
    if (!(await cache.match(item.url))) await cache.add(item.url);
    saved++;
    onProgress({ saved, total: items.length });
  }
}
