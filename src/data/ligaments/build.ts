import type { Ligament } from '../types';

/** The anatomy references every record is cross-checked against. */
export const ANATOMY = ['teachmeanatomy', 'kenhub', 'wikipedia'];
export const CLINICAL = [...ANATOMY, 'physiopedia', 'radiopaedia'];

type Required = Pick<Ligament, 'id' | 'name' | 'latinName' | 'regionId' | 'groupId' | 'kind' | 'jointIds' | 'summary' | 'structure' | 'attachments' | 'functions' | 'restraints' | 'healing' | 'clinical' | 'sourceIds'>;
type Optional = Partial<Omit<Ligament, keyof Required>>;

/** A ligament record with empty lists for what it does not have (no nerve named, no special test…). */
export function ligament(fields: Required & Optional): Ligament {
  return {
    synonyms: [],
    protectiveMuscleIds: [],
    nerveIds: [],
    bloodSupply: [],
    injuryMechanisms: [],
    grading: [],
    palpation: [],
    specialTestIds: [],
    imaging: [],
    exerciseIds: [],
    protocolIds: [],
    variationNotes: [],
    ...fields,
  };
}

/** The usual three grades of a ligament sprain. */
export const SPRAIN_GRADES = [
  'Grade I: fibres stretched, no laxity; pain and tenderness, firm end-feel.',
  'Grade II: partial tear; some laxity with a firm end-point, swelling, painful stress test.',
  'Grade III: complete rupture; marked laxity with a soft or absent end-point (often less painful than a grade II).',
];
