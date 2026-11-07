import type { Technique } from '../techniqueTypes';

type Required = Pick<Technique, 'id' | 'familyId' | 'name' | 'areas' | 'conditionIds' | 'summary' | 'position' | 'steps' | 'keyPoints' | 'dosage'>;
type Optional = Partial<Pick<Technique, 'aliases' | 'muscleIds' | 'jointIds' | 'nerveIds' | 'exerciseIds' | 'safety' | 'evidence'>>;

/** A technique with empty lists for the links it does not have. */
export function technique(fields: Required & Optional): Technique {
  return { aliases: [], muscleIds: [], jointIds: [], nerveIds: [], exerciseIds: [], safety: [], evidence: [], ...fields };
}

/**
 * How the trigger point is held and needled: flat against bone, lifted in a pincer grip, or only
 * superficially (into the tissue over the trigger point, for muscles too close to vital structures).
 */
export type NeedlingGrip = 'flat' | 'pincer' | 'superficial';

interface NeedlingFields {
  id: string;
  name: string;
  muscleIds: string[];
  areas: Technique['areas'];
  conditionIds: string[];
  summary: string;
  position: string;
  /** How to find the trigger point. */
  palpation: string;
  /** Where and in which direction the needle goes. */
  insertion: string;
  grip: NeedlingGrip;
  /** The usual needle, diameter × length, e.g. "0.30 × 30 mm". */
  needle: string;
  keyPoints: string[];
  safety?: string[];
  exerciseIds?: string[];
  jointIds?: string[];
  nerveIds?: string[];
}

const GRIP_LABEL: Record<NeedlingGrip, string> = {
  flat: 'Flat grip (trigger point held against the bone below)',
  pincer: 'Pincer grip (muscle lifted between thumb and fingers)',
  superficial: 'Superficial dry needling only',
};

const DEEP = {
  needle: 'Piston gently (in and out without leaving the muscle) to elicit local twitch responses; stop when twitches fade or the patient has had enough.',
  dosage: '5–10 local twitch responses per trigger point, or static needling for 5–10 minutes; 1–3 muscles per session, weekly for 3–6 sessions.',
};
const SUPERFICIAL = {
  needle: 'Leave the needle about 30 seconds; turn it or add a needle nearby if the tenderness has not eased.',
  dosage: 'About 30 seconds per point, repeated until pressure tenderness over the trigger point has dropped; weekly for 3–6 sessions.',
};

/** Dry needling entries share the same sequence; only palpation, insertion, grip, needle and safety differ. */
export function needling(fields: NeedlingFields): Technique {
  const method = fields.grip === 'superficial' ? SUPERFICIAL : DEEP;
  return technique({
    id: fields.id,
    familyId: 'dry-needling',
    name: fields.name,
    areas: fields.areas,
    muscleIds: fields.muscleIds,
    jointIds: fields.jointIds ?? [],
    nerveIds: fields.nerveIds ?? [],
    exerciseIds: fields.exerciseIds ?? [],
    conditionIds: fields.conditionIds,
    summary: fields.summary,
    position: fields.position,
    steps: [
      fields.palpation,
      'Clean the skin, put on gloves where bleeding is possible, and insert the needle through its guide tube with a light tap.',
      fields.insertion,
      method.needle,
      'Withdraw, press on the site for haemostasis, and re-test pain and range straight away.',
      'Follow with a stretch or active exercise for the muscle.',
    ],
    keyPoints: [`${GRIP_LABEL[fields.grip]}; usually a ${fields.needle} needle.`, ...fields.keyPoints],
    dosage: method.dosage,
    safety: fields.safety ?? [],
  });
}
