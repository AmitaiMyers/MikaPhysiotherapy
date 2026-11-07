/** Pure helpers for therapy sessions: creating, copying structure and ordering. */
import type { Session, SessionContent, SessionSet } from './types';

export const MODALITIES = ['TENS', 'Interferential', 'Ultrasound', 'Shockwave', 'Laser', 'Dry needling', 'Heat', 'Ice', 'Taping', 'Massage', 'Mobilisation', 'Manipulation', 'Electrical stimulation (NMES)', 'Blood flow restriction'];

export const OUTCOME_MEASURES = ['KOOS', 'IKDC', 'LEFS', 'HOOS', 'Oxford Knee Score', 'Oxford Hip Score', 'ODI', 'NDI', 'QuickDASH', 'SPADI', 'PRWE', 'VISA-A', 'VISA-P', 'ATRS', 'FAAM', 'TUG (s)', '30-s chair stand', '6-minute walk (m)', 'ACL-RSI'];

export const SCORE_SUGGESTIONS = ['Pain', 'Function', 'Confidence', 'Range of motion', 'Strength', 'Sleep', 'Swelling', 'Activity level'];

export function emptyContent(): SessionContent {
  return {
    subjective: { notes: '', pain: { rest: null, activity: null, worst: null } },
    objective: { rom: [], strength: [], tests: [], outcomes: [], girth: [], movement: '', notes: '' },
    treatment: { modalities: [], manualTherapy: '', education: '', notes: '' },
    techniques: [],
    exercises: [],
    protocol: { phaseIndex: null, criteriaMet: [] },
    homeProgramme: null,
    scores: [],
    assessment: '',
    plan: '',
    notes: '',
  };
}

export const emptySet = (): SessionSet => ({ reps: null, weightKg: null, durationSec: null, rpe: null });

/**
 * The plan of a session without this session's findings: what to measure, test and do next time.
 * Measurements, results and free text are cleared; exercises keep their sets and techniques their
 * dosage (they are the plan); treatment choices, the home programme, the protocol phase and the score subjects are kept.
 */
export function sessionStructure(content: SessionContent): SessionContent {
  return {
    subjective: { notes: '', pain: { rest: null, activity: null, worst: null } },
    objective: {
      rom: content.objective.rom.map((entry) => ({ ...entry, active: null, passive: null, note: '' })),
      strength: content.objective.strength.map((entry) => ({ ...entry, mmt: null, dynamometerKg: null, note: '' })),
      tests: content.objective.tests.map((entry) => ({ ...entry, result: null, note: '' })),
      outcomes: content.objective.outcomes.map((entry) => ({ ...entry, score: null, note: '' })),
      girth: content.objective.girth.map((entry) => ({ ...entry, cm: null })),
      movement: '',
      notes: '',
    },
    treatment: { ...content.treatment, modalities: [...content.treatment.modalities] },
    techniques: content.techniques.map((entry) => ({ ...entry, values: { ...entry.values }, response: '', adverseEvent: '' })),
    exercises: content.exercises.map((exercise) => ({ ...exercise, sets: exercise.sets.map((set) => ({ ...set })), note: exercise.note })),
    protocol: { phaseIndex: content.protocol.phaseIndex, criteriaMet: [] },
    homeProgramme: content.homeProgramme === null ? null : { ...content.homeProgramme, items: content.homeProgramme.items.map((item) => ({ ...item })) },
    scores: content.scores.map((entry) => ({ ...entry, value: null })),
    assessment: '',
    plan: '',
    notes: '',
  };
}

/** Only the clinical content of a session (drops ids, dates and status). */
export function contentOf(session: Session): SessionContent {
  const { subjective, objective, treatment, techniques, exercises, protocol, homeProgramme, scores, assessment, plan, notes } = session;
  return { subjective, objective, treatment, techniques, exercises, protocol, homeProgramme, scores, assessment, plan, notes };
}

const chronological = (a: Session, b: Session) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`);

/** Newest first. */
export function sortSessionsNewestFirst(sessions: Session[]): Session[] {
  return [...sessions].sort((a, b) => chronological(b, a));
}

/** The most recent completed session of the patient (in the same episode when given). */
export function lastCompletedSession(sessions: Session[], patientId: string, episodeId: string | null): Session | null {
  const candidates = sessions.filter((s) => s.patientId === patientId && s.status === 'done' && (episodeId === null || s.episodeId === episodeId));
  return sortSessionsNewestFirst(candidates)[0] ?? null;
}

/** Score subjects used before for a patient, most recent first, then the suggestions. */
export function scoreSubjects(sessions: Session[], patientId: string): string[] {
  const used = sortSessionsNewestFirst(sessions.filter((s) => s.patientId === patientId)).flatMap((s) => s.scores.map((score) => score.subject));
  return [...new Set([...used, ...SCORE_SUGGESTIONS])];
}
