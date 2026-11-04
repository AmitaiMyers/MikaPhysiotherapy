import type { PhaseExercise, ProtocolRegion, Treatment } from '../protocolTypes';

/** Body regions and areas used to group fractures and surgeries, in display order. */
export const PROTOCOL_REGIONS: ProtocolRegion[] = [
  {
    id: 'lower',
    name: 'Lower extremity',
    areas: [
      { id: 'hip', name: 'Hip' },
      { id: 'thigh', name: 'Thigh' },
      { id: 'knee', name: 'Knee' },
      { id: 'leg', name: 'Leg' },
      { id: 'ankle', name: 'Ankle' },
      { id: 'foot', name: 'Foot' },
    ],
  },
  {
    id: 'upper',
    name: 'Upper extremity',
    areas: [
      { id: 'shoulder', name: 'Shoulder' },
      { id: 'arm', name: 'Arm' },
      { id: 'elbow', name: 'Elbow' },
      { id: 'wrist', name: 'Forearm & wrist' },
      { id: 'hand', name: 'Hand' },
    ],
  },
  {
    id: 'spine',
    name: 'Spine',
    areas: [
      { id: 'cervical', name: 'Cervical spine' },
      { id: 'thoracolumbar', name: 'Thoracic & lumbar spine' },
    ],
  },
];

/** An exercise in a phase, optionally with a phase-specific note. */
export function ex(exerciseId: string, note?: string): PhaseExercise {
  return note === undefined ? { exerciseId } : { exerciseId, note };
}

export const PROTOCOL_DISCLAIMER: Record<Treatment, string> = {
  operative: 'Always follow the operating surgeon’s protocol.',
  'non-operative': 'Always follow the treating surgeon’s or fracture clinic’s instructions.',
  either: 'Always follow the operating surgeon’s protocol, or the fracture clinic’s instructions when treated without surgery.',
};

/** Shared return-to-sport criteria after knee surgery. */
export const KNEE_RETURN_TO_SPORT = [
  'Full, pain-free range of motion and no effusion after training.',
  'Quadriceps and hamstring strength at least 90% of the other leg (dynamometer).',
  'Hop tests (single, triple, crossover and 6-metre timed hop) at least 90% of the other leg, with good landing quality.',
  'Completed sport-specific drills (running, cutting, landing) without symptoms.',
  'Psychological readiness, e.g. with the ACL-RSI questionnaire.',
];

/** Shared return-to-sport criteria after ankle and foot injury. */
export const ANKLE_RETURN_TO_SPORT = [
  'Full, pain-free range of motion; weight-bearing lunge (knee-to-wall) close to the other side.',
  'Single-leg calf raises close to the other side in height and number.',
  'Balance and reach tests (e.g. Y-balance) close to the other side.',
  'Pain-free hopping, running, cutting and sport-specific drills.',
];

/** Return to activity after hip or knee replacement. */
export const ARTHROPLASTY_RETURN_TO_ACTIVITY = [
  'Low-impact activities (walking, cycling, swimming once the wound has healed, golf, doubles tennis) are encouraged once the surgeon clears them.',
  'High-impact running and jumping sports need an individual discussion with the surgeon.',
  'Driving usually when the patient can perform an emergency stop safely and has stopped strong painkillers, often around 6 weeks.',
];
