import type { Exercise, ExerciseRegion } from '../exerciseTypes';

/** Exercise regions and groups, in display order. */
export const EXERCISE_REGIONS: ExerciseRegion[] = [
  {
    id: 'upper-neck',
    name: 'Upper extremity & neck',
    groups: [
      { id: 'neck', name: 'Neck', description: 'Deep neck flexors, cervical extensors, isometrics, mobility and stretches.' },
      { id: 'scapula', name: 'Scapular control', description: 'Serratus anterior, trapezius and rhomboids: position and control of the shoulder blade.' },
      { id: 'rotator-cuff', name: 'Rotator cuff', description: 'Isometric to dynamic strengthening of the cuff, and dynamic stability.' },
      { id: 'shoulder-mobility', name: 'Shoulder mobility', description: 'Passive, active-assisted and active range of motion, and stretches.' },
      { id: 'shoulder-strength', name: 'Shoulder & chest strength', description: 'Deltoid, pectorals and latissimus dorsi.' },
      { id: 'elbow-forearm', name: 'Elbow & forearm', description: 'Elbow flexors and extensors, wrist flexors and extensors, pronation and supination.' },
      { id: 'wrist-hand', name: 'Wrist & hand', description: 'Range of motion, tendon gliding, grip, pinch and intrinsic muscles.' },
      { id: 'upper-neural', name: 'Upper limb nerve mobility', description: 'Median, ulnar and radial nerve sliders.' },
    ],
  },
  {
    id: 'lower',
    name: 'Lower extremity',
    groups: [
      { id: 'hip-extensors', name: 'Hip extensors (glutes)', description: 'Gluteus maximus and hamstrings as hip extensors.' },
      { id: 'hip-abductors-rotators', name: 'Hip abductors & rotators', description: 'Gluteus medius and minimus, TFL and the deep rotators.' },
      { id: 'hip-adductors', name: 'Hip adductors', description: 'Adductor strengthening and stretching (groin).' },
      { id: 'hip-flexors', name: 'Hip flexors', description: 'Iliopsoas and rectus femoris strength and length.' },
      { id: 'hip-mobility', name: 'Hip mobility', description: 'Range of motion and stretches for the hip and buttock.' },
      { id: 'quadriceps', name: 'Knee — quadriceps', description: 'From quadriceps activation to loaded squatting and lunging.' },
      { id: 'hamstrings', name: 'Knee — hamstrings', description: 'Isometric, concentric and eccentric hamstring work.' },
      { id: 'knee-mobility', name: 'Knee mobility', description: 'Knee flexion and extension range and patellar mobility.' },
      { id: 'calf', name: 'Calf (triceps surae)', description: 'Gastrocnemius and soleus strength, tendon loading and stretches.' },
      { id: 'ankle', name: 'Ankle', description: 'Range of motion, dorsiflexion, eversion and inversion strength.' },
      { id: 'foot', name: 'Foot', description: 'Intrinsic foot muscles and the plantar fascia.' },
      { id: 'balance', name: 'Balance & proprioception', description: 'Static and dynamic balance, from double-leg to perturbed single-leg stance.' },
      { id: 'plyometric', name: 'Plyometrics & return to sport', description: 'Jumping, hopping, landing, running and change of direction.' },
      { id: 'lower-neural', name: 'Lower limb nerve mobility', description: 'Sciatic and femoral nerve sliders.' },
    ],
  },
  {
    id: 'spine-core',
    name: 'Spine & core',
    groups: [
      { id: 'deep-core', name: 'Deep core & motor control', description: 'Transversus abdominis, multifidus and low-load spinal control.' },
      { id: 'anterior-core', name: 'Anterior core', description: 'Rectus abdominis and obliques: flexion and anti-extension.' },
      { id: 'lateral-core', name: 'Lateral core & anti-rotation', description: 'Quadratus lumborum and obliques: side bridging, carries and anti-rotation.' },
      { id: 'back-extensors', name: 'Back extensors', description: 'Erector spinae and multifidus: extension and hip hinge.' },
      { id: 'spine-mobility', name: 'Spine mobility', description: 'Lumbar and thoracic range of motion and stretches.' },
      { id: 'breathing', name: 'Breathing', description: 'Diaphragmatic breathing, airway clearance and respiratory muscle training.' },
      { id: 'pelvic-floor', name: 'Pelvic floor', description: 'Pelvic floor muscle training and relaxation.' },
    ],
  },
  {
    id: 'whole-body',
    name: 'Whole body & conditioning',
    groups: [
      { id: 'conditioning', name: 'Cardiovascular conditioning', description: 'Low-impact aerobic exercise used through rehabilitation.' },
      { id: 'functional', name: 'Functional & gait training', description: 'Transfers, sit-to-stand, walking with aids, stairs, carries and compound lifts.' },
    ],
  },
];

/** Default references for exercise technique and dosage. */
export const EXERCISE_SOURCES = ['physiopedia', 'acsm-2009'];

type DefaultedField = 'aliases' | 'secondaryMuscles' | 'nerveIds' | 'regressionIds' | 'progressionIds' | 'precautions' | 'mistakes';

export type ExerciseInput = Omit<Exercise, 'sourceIds' | DefaultedField> &
  Partial<Pick<Exercise, DefaultedField>> & {
    extraSourceIds?: string[];
  };

/** Fill in defaults shared by every exercise. */
export function exercise({ extraSourceIds = [], ...input }: ExerciseInput): Exercise {
  return {
    aliases: [],
    secondaryMuscles: [],
    nerveIds: [],
    regressionIds: [],
    progressionIds: [],
    precautions: [],
    mistakes: [],
    ...input,
    sourceIds: [...EXERCISE_SOURCES, ...extraSourceIds],
  };
}
