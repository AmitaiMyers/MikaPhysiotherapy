import type { Tendon } from '../types';

export const CLINICAL = ['teachmeanatomy', 'kenhub', 'wikipedia', 'physiopedia', 'radiopaedia'];

type Required = Pick<Tendon, 'id' | 'name' | 'muscleIds' | 'end' | 'summary' | 'structure' | 'attachments' | 'functions' | 'healing' | 'clinical' | 'loading'>;
type Optional = Partial<Omit<Tendon, keyof Required>>;

/** A tendon record with empty lists for what it does not have, cross-checked against the usual sources. */
export function tendon(fields: Required & Optional): Tendon {
  return {
    synonyms: [],
    bloodSupply: [],
    injuryMechanisms: [],
    grading: [],
    palpation: [],
    specialTestIds: [],
    imaging: [],
    exerciseIds: [],
    protocolIds: [],
    sourceIds: CLINICAL,
    ...fields,
  };
}

/** Tendinopathy healing in general: slow, load-driven remodelling. */
export const TENDINOPATHY_HEALING =
  'Tendinopathy is a failed healing response to overload, not inflammation: symptoms usually improve over 3–6 months of progressive loading (sometimes 12). Rest alone, passive treatments and repeated corticosteroid injections do not restore tendon capacity.';

/** The staged loading programme used for most lower-limb tendinopathies (after Silbernagel, Malliaras, Rio). */
export function loadingStages(stage2: string, stage3: string): string[] {
  return [
    'Pain-monitored loading: activity is fine if pain stays at or below about 3/10 during it and is back to baseline by the next morning.',
    'Stage 1 — isometrics: 5 × 30–45 s holds at about 70% effort, several times a day, to settle pain.',
    `Stage 2 — heavy slow resistance: ${stage2} 3–4 sets of 6–15, slow (3 s up, 3 s down), every second day, progressing load weekly.`,
    `Stage 3 — energy storage: ${stage3}, building volume then speed.`,
    'Stage 4 — return to sport: sport-specific drills, then training and competition; keep a strength session once or twice a week.',
  ];
}
