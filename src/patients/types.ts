/** Data model of the Patients tab. All of it is stored encrypted on the device. */

export type Sex = 'female' | 'male' | 'other';
export type Side = 'left' | 'right';
export type EpisodeSide = Side | 'both' | 'none';

export interface Patient {
  id: string;
  firstName: string;
  /** Age when it was entered (see ageRecordedOn); the current age is derived from it. */
  age: number | null;
  /** Local date (YYYY-MM-DD) the age was entered. */
  ageRecordedOn: string;
  sex: Sex | null;
  medicalBackground: string;
  lifestyle: string;
  createdAt: string;
}

/** One problem treated over a period, e.g. "Right knee — ACL reconstruction". */
export interface Episode {
  id: string;
  patientId: string;
  title: string;
  side: EpisodeSide;
  diagnosis: string;
  /** A protocol from the Rehab tab, or null. */
  protocolId: string | null;
  /** Surgery or injury date (YYYY-MM-DD): week 0 of the protocol. */
  startDate: string | null;
  status: 'active' | 'discharged';
  notes: string;
  createdAt: string;
}

/** A photo or PDF; the file itself is stored encrypted separately under the same id. */
export interface Attachment {
  id: string;
  patientId: string;
  episodeId: string | null;
  name: string;
  mimeType: string;
  size: number;
  note: string;
  createdAt: string;
}

export interface PainScores {
  rest: number | null;
  activity: number | null;
  worst: number | null;
}

/** Range of motion of one joint movement, in degrees. */
export interface RomEntry {
  jointId: string;
  movement: string;
  side: Side;
  active: number | null;
  passive: number | null;
  note: string;
}

export const MMT_GRADES = ['0', '1', '2', '3-', '3', '3+', '4-', '4', '4+', '5'] as const;
export type MmtGrade = (typeof MMT_GRADES)[number];

export interface StrengthEntry {
  /** What was tested, e.g. "Knee extension" or a muscle name. */
  label: string;
  muscleId: string | null;
  side: Side;
  mmt: MmtGrade | null;
  dynamometerKg: number | null;
  note: string;
}

export type TestResult = 'positive' | 'negative' | 'inconclusive';

export interface TestEntry {
  testId: string;
  side: Side;
  result: TestResult | null;
  note: string;
}

export interface OutcomeEntry {
  /** e.g. "KOOS", "ODI", "LEFS". */
  measure: string;
  score: number | null;
  note: string;
}

export interface GirthEntry {
  /** e.g. "10 cm above the patella". */
  site: string;
  side: Side;
  cm: number | null;
}

/** A 0–10 score Mika gives a subject she wants to follow on a graph (pain, function, confidence…). */
export interface ScoreEntry {
  subject: string;
  value: number | null;
}

export interface SessionSet {
  reps: number | null;
  weightKg: number | null;
  durationSec: number | null;
  rpe: number | null;
}

export interface SessionExercise {
  /** A Rehab exercise id or a custom exercise id. */
  exerciseId: string;
  sets: SessionSet[];
  note: string;
}

export interface HomeProgrammeItem {
  exerciseId: string;
  dosage: string;
  note: string;
}

/** The clinical content of a session: what templates and "repeat last session" copy. */
export interface SessionContent {
  subjective: { notes: string; pain: PainScores };
  objective: {
    rom: RomEntry[];
    strength: StrengthEntry[];
    tests: TestEntry[];
    outcomes: OutcomeEntry[];
    girth: GirthEntry[];
    /** Movement and gait observation. */
    movement: string;
    notes: string;
  };
  treatment: { modalities: string[]; manualTherapy: string; education: string; notes: string };
  exercises: SessionExercise[];
  /** Protocol phase this session is in, and the criteria to progress that were met. */
  protocol: { phaseIndex: number | null; criteriaMet: string[] };
  homeProgramme: { title: string; items: HomeProgrammeItem[] } | null;
  scores: ScoreEntry[];
  assessment: string;
  plan: string;
  notes: string;
}

/** A therapy session: planned in the calendar, then completed. */
export interface Session extends SessionContent {
  id: string;
  patientId: string;
  episodeId: string | null;
  status: 'planned' | 'done';
  /** Local date YYYY-MM-DD and time HH:MM. */
  date: string;
  startTime: string;
  durationMin: number;
  /** Shared by the sessions of one recurring booking. */
  seriesId: string | null;
  /** Calendar event this session was imported from (UID and start), to avoid importing it twice. */
  externalId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionTemplate {
  id: string;
  name: string;
  content: SessionContent;
  createdAt: string;
}

export interface CustomExercise {
  id: string;
  name: string;
  notes: string;
}

export interface Settings {
  id: 'settings';
  /** Working hours shown in the calendar, HH:MM. */
  dayStart: string;
  dayEnd: string;
  defaultDurationMin: 30 | 60;
}

/** Everything stored in the vault, by record kind. */
export interface RecordTypes {
  patient: Patient;
  episode: Episode;
  session: Session;
  template: SessionTemplate;
  customExercise: CustomExercise;
  attachment: Attachment;
  settings: Settings;
}

export type RecordKind = keyof RecordTypes;

export const RECORD_KINDS: RecordKind[] = ['patient', 'episode', 'session', 'template', 'customExercise', 'attachment', 'settings'];
