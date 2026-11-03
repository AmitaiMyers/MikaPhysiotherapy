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
    groups: [],
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
    groups: [],
  },
];
