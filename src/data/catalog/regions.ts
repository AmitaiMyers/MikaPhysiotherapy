import type { Region } from '../types';

/**
 * Regions and their compartments / functional groups, in display order.
 * Upper limb grouping follows the usual clinical-anatomy division (axio-appendicular,
 * scapulohumeral, arm and forearm compartments, hand compartments).
 */
export const REGIONS: Region[] = [
  {
    id: 'head-neck',
    name: 'Head & neck',
    groups: [],
  },
  {
    id: 'trunk-pelvis',
    name: 'Trunk & pelvis',
    groups: [
      {
        id: 'back-intermediate',
        name: 'Back — intermediate (serratus posterior)',
        description: 'Thin respiratory muscles from the spine to the ribs; intercostal nerves.',
      },
      {
        id: 'erector-spinae',
        name: 'Back — deep: erector spinae',
        description: 'Long vertical extensors of the spine, from lateral to medial: iliocostalis, longissimus, spinalis. Dorsal rami.',
      },
      {
        id: 'transversospinalis',
        name: 'Back — deep: transversospinalis',
        description: 'Short oblique muscles from transverse to spinous processes; segmental control and rotation. Dorsal rami.',
      },
      {
        id: 'posterior-abdominal-wall',
        name: 'Posterior abdominal wall',
        description: 'Quadratus lumborum (psoas major and iliacus are listed with the hip).',
      },
      {
        id: 'thoracic-wall',
        name: 'Thoracic wall & diaphragm',
        description: 'Muscles of breathing: diaphragm (phrenic nerve) and intercostals (intercostal nerves).',
      },
      {
        id: 'abdominal-wall',
        name: 'Anterolateral abdominal wall',
        description: 'Flex and rotate the trunk, compress the abdomen and stabilise the lumbopelvic region. Thoraco-abdominal nerves.',
      },
      {
        id: 'pelvic-floor',
        name: 'Pelvic floor (pelvic diaphragm)',
        description: 'Levator ani and coccygeus: support the pelvic organs and maintain continence. Direct sacral branches (S3–S5) and the pudendal nerve.',
      },
      {
        id: 'perineum',
        name: 'Perineum & sphincters',
        description: 'Superficial and deep perineal muscles and the external sphincters; pudendal nerve.',
      },
    ],
  },
  {
    id: 'upper-limb',
    name: 'Upper limb',
    groups: [
      {
        id: 'anterior-axio-appendicular',
        name: 'Anterior axio-appendicular (pectoral)',
        description: 'Connect the upper limb to the front of the thoracic wall.',
      },
      {
        id: 'posterior-axio-appendicular',
        name: 'Posterior axio-appendicular',
        description: 'Connect the upper limb to the vertebral column; superficial and deep layers.',
      },
      {
        id: 'scapulohumeral',
        name: 'Scapulohumeral & rotator cuff',
        description: 'Run from the scapula to the humerus and act on the glenohumeral joint.',
      },
      {
        id: 'arm-anterior',
        name: 'Arm — anterior (flexor) compartment',
        description: 'Musculocutaneous nerve; flex the elbow and shoulder, supinate the forearm.',
      },
      {
        id: 'arm-posterior',
        name: 'Arm — posterior (extensor) compartment',
        description: 'Radial nerve; extend the elbow.',
      },
      {
        id: 'forearm-anterior',
        name: 'Forearm — anterior (flexor-pronator) compartment',
        description: 'Mostly median nerve; flex the wrist and digits, pronate the forearm. Superficial, intermediate and deep layers.',
      },
      {
        id: 'forearm-posterior',
        name: 'Forearm — posterior (extensor-supinator) compartment',
        description: 'Radial nerve and its deep branch; extend the wrist and digits, supinate the forearm. Superficial and deep layers.',
      },
      {
        id: 'hand-thenar',
        name: 'Hand — thenar & adductor',
        description: 'Muscles of the thumb ball and the adductor of the thumb.',
      },
      {
        id: 'hand-hypothenar',
        name: 'Hand — hypothenar',
        description: 'Muscles of the little-finger ball; ulnar nerve.',
      },
      {
        id: 'hand-central',
        name: 'Hand — central (lumbricals & interossei)',
        description: 'Intrinsic muscles of the palm that flex the MCP and extend the IP joints.',
      },
    ],
  },
  {
    id: 'lower-limb',
    name: 'Lower limb',
    groups: [
      {
        id: 'gluteal',
        name: 'Gluteal region & deep hip rotators',
        description: 'Gluteal nerves and branches of the sacral plexus; extend, abduct and rotate the hip and stabilise the pelvis.',
      },
      {
        id: 'iliopsoas',
        name: 'Iliopsoas (anterior hip)',
        description: 'The main hip flexors, from the lumbar spine and iliac fossa to the lesser trochanter.',
      },
      {
        id: 'thigh-anterior',
        name: 'Thigh — anterior compartment',
        description: 'Femoral nerve; extend the knee (quadriceps) and flex the hip.',
      },
      {
        id: 'thigh-medial',
        name: 'Thigh — medial (adductor) compartment',
        description: 'Mostly obturator nerve; adduct the hip.',
      },
      {
        id: 'thigh-posterior',
        name: 'Thigh — posterior compartment (hamstrings)',
        description: 'Sciatic nerve; extend the hip and flex the knee.',
      },
      {
        id: 'leg-anterior',
        name: 'Leg — anterior compartment',
        description: 'Deep fibular nerve; dorsiflex the ankle and extend the toes.',
      },
      {
        id: 'leg-lateral',
        name: 'Leg — lateral compartment',
        description: 'Superficial fibular nerve; evert the foot.',
      },
      {
        id: 'leg-posterior',
        name: 'Leg — posterior compartment',
        description: 'Tibial nerve; plantarflex the ankle, flex the toes and invert the foot. Superficial (triceps surae) and deep layers.',
      },
      {
        id: 'foot-dorsal',
        name: 'Foot — dorsum',
        description: 'Deep fibular nerve; extend the toes.',
      },
      {
        id: 'foot-plantar',
        name: 'Foot — sole (four layers)',
        description: 'Medial and lateral plantar nerves; support the arches and move the toes.',
      },
    ],
  },
];
