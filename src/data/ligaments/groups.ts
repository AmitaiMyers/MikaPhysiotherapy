import type { LigamentGroup, RegionId } from '../types';

/** How the Ligaments tab groups each region, in display order (by joint, head to foot and proximal to distal). */
export const LIGAMENT_GROUPS: Record<RegionId, LigamentGroup[]> = {
  'head-neck': [
    { id: 'tmj', name: 'Temporomandibular joint', description: 'Capsule, disc and the ligaments that guide and limit jaw opening.' },
    { id: 'hyoid-larynx', name: 'Hyoid & larynx', description: 'Ligaments suspending the hyoid bone and joining the laryngeal cartilages.' },
    { id: 'cervical', name: 'Upper cervical spine', description: 'Craniovertebral ligaments and the nuchal ligament.' },
  ],
  'trunk-pelvis': [
    { id: 'spine', name: 'Vertebral column', description: 'Longitudinal and segmental ligaments joining the vertebrae.' },
    { id: 'discs', name: 'Intervertebral discs', description: 'Annulus fibrosus and nucleus pulposus at each spinal region.' },
    { id: 'ribs', name: 'Ribs & thoracic wall', description: 'Costovertebral, costotransverse and intercostal ligaments and membranes.' },
    { id: 'pelvis', name: 'Pelvis & sacroiliac joints', description: 'Sacroiliac, pubic, sacrococcygeal and pelvic floor-related ligaments.' },
  ],
  'upper-limb': [
    { id: 'shoulder-girdle', name: 'Sternoclavicular & acromioclavicular joints', description: 'The clavicle’s two joints and the coracoclavicular ligaments.' },
    { id: 'glenohumeral', name: 'Glenohumeral joint', description: 'Capsule, glenohumeral ligaments, coracohumeral ligament and labrum.' },
    { id: 'elbow', name: 'Elbow & forearm', description: 'Collateral ligaments, annular ligament and interosseous membrane.' },
    { id: 'wrist', name: 'Wrist', description: 'Radiocarpal, ulnocarpal, intercarpal ligaments, TFCC and retinacula.' },
    { id: 'hand', name: 'Hand & fingers', description: 'Carpometacarpal, metacarpal, MCP and interphalangeal ligaments and the palmar aponeurosis.' },
  ],
  'lower-limb': [
    { id: 'hip', name: 'Hip joint', description: 'Capsule, the three capsular ligaments, labrum and ligament of the head of the femur.' },
    { id: 'knee', name: 'Knee joint', description: 'Cruciate and collateral ligaments, menisci, posterolateral corner and patellar retinacula.' },
    { id: 'tibiofibular', name: 'Tibiofibular joints', description: 'Proximal tibiofibular joint, interosseous membrane and the distal syndesmosis.' },
    { id: 'ankle', name: 'Ankle & subtalar joint', description: 'Lateral ankle ligaments, deltoid ligament, talocalcaneal ligaments and retinacula.' },
    { id: 'midfoot', name: 'Midfoot & arches', description: 'Spring, bifurcate and plantar ligaments, plantar fascia, intertarsal and Lisfranc ligaments.' },
    { id: 'forefoot', name: 'Forefoot & toes', description: 'Metatarsal ligaments, plantar plates, MTP and interphalangeal capsules and collateral ligaments.' },
  ],
};
