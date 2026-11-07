import type { Technique } from '../techniqueTypes';

type Required = Pick<Technique, 'id' | 'familyId' | 'name' | 'areas' | 'conditionIds' | 'summary' | 'position' | 'steps' | 'keyPoints' | 'dosage'>;
type Optional = Partial<Pick<Technique, 'aliases' | 'muscleIds' | 'jointIds' | 'nerveIds' | 'exerciseIds' | 'safety' | 'evidence'>>;

/** A technique with empty lists for the links it does not have. */
export function technique(fields: Required & Optional): Technique {
  return { aliases: [], muscleIds: [], jointIds: [], nerveIds: [], exerciseIds: [], safety: [], evidence: [], ...fields };
}

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
  keyPoints: string[];
  safety?: string[];
  exerciseIds?: string[];
  jointIds?: string[];
  nerveIds?: string[];
}

/** Dry needling entries share the same sequence; only palpation, insertion and safety differ. */
export function needling(fields: NeedlingFields): Technique {
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
      'Piston gently (in and out without leaving the muscle) to elicit local twitch responses; stop when twitches fade or the patient has had enough.',
      'Withdraw, press on the site for haemostasis, and re-test pain and range straight away.',
      'Follow with a stretch or active exercise for the muscle.',
    ],
    keyPoints: fields.keyPoints,
    dosage: '5–10 local twitch responses per trigger point, or static needling for 5–10 minutes; 1–3 muscles per session, weekly for 3–6 sessions.',
    safety: fields.safety ?? [],
  });
}
