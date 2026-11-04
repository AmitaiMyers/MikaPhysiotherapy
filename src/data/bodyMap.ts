import generated from './generated/bodyMap.json';

/** Written by scripts/anatomy/render-body.mjs: what each colour in the body ID maps stands for. */
export type BodyView = 'front' | 'back';
export type BodyLayer = 'superficial' | 'deep' | 'skeleton';
export interface BodyTarget {
  kind: 'muscle' | 'bone';
  id: string;
}

interface BodyMap {
  size: { width: number; height: number };
  targets: BodyTarget[];
  layers: Record<BodyLayer, Record<BodyView, number[]>>;
}

const MAP = generated as BodyMap;

export const BODY_SIZE = MAP.size;

export const BODY_LAYER_LABELS: Record<BodyLayer, string> = { superficial: 'Muscles', deep: 'Deep', skeleton: 'Skeleton' };

const base = `${import.meta.env.BASE_URL}images/body/`;
export const bodyImageUrl = (view: BodyView, layer: BodyLayer) => `${base}${view}-${layer}.webp`;
export const bodyIdMapUrl = (view: BodyView, layer: BodyLayer) => `${base}${view}-${layer}-ids.png`;

/** The structure an ID-map colour stands for; index 0 (and unknown colours) are empty. */
export function bodyTarget(index: number): BodyTarget | null {
  return index === 0 ? null : (MAP.targets[index - 1] ?? null);
}

export function targetIndex(target: BodyTarget): number {
  return MAP.targets.findIndex((t) => t.kind === target.kind && t.id === target.id) + 1;
}

/** Whether a structure can be tapped in a view and layer (it is drawn there). */
export function isVisible(target: BodyTarget, view: BodyView, layer: BodyLayer): boolean {
  return MAP.layers[layer][view].includes(targetIndex(target));
}
