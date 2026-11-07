import type { Condition, TechniqueArea, TechniqueAreaId } from '../techniqueTypes';

/** Sub-regions in display order, grouped under the four anatomy regions. */
export const TECHNIQUE_AREAS: TechniqueArea[] = [
  { id: 'head-jaw', name: 'Head & jaw', regionId: 'head-neck' },
  { id: 'neck', name: 'Neck', regionId: 'head-neck' },
  { id: 'shoulder', name: 'Shoulder', regionId: 'upper-limb' },
  { id: 'elbow', name: 'Elbow & forearm', regionId: 'upper-limb' },
  { id: 'wrist-hand', name: 'Wrist & hand', regionId: 'upper-limb' },
  { id: 'thoracic', name: 'Thoracic spine & ribs', regionId: 'trunk-pelvis' },
  { id: 'lumbar', name: 'Lumbar spine', regionId: 'trunk-pelvis' },
  { id: 'pelvis', name: 'Pelvis & sacroiliac', regionId: 'trunk-pelvis' },
  { id: 'hip', name: 'Hip & buttock', regionId: 'lower-limb' },
  { id: 'knee', name: 'Knee & thigh', regionId: 'lower-limb' },
  { id: 'ankle-foot', name: 'Leg, ankle & foot', regionId: 'lower-limb' },
];

const condition = (id: string, name: string, areas: TechniqueAreaId[], aliases: string[] = [], protocolIds: string[] = []): Condition => ({ id, name, areas, aliases, protocolIds });

/** Conditions the techniques are used for; the evidence of each family is graded per condition. */
export const CONDITIONS: Condition[] = [
  condition('myofascial-pain', 'Myofascial pain (trigger points)', ['neck', 'shoulder', 'elbow', 'thoracic', 'lumbar', 'hip', 'knee', 'ankle-foot', 'head-jaw'], ['Trigger points', 'Muscle knots']),
  condition('tmd', 'Temporomandibular disorder', ['head-jaw'], ['TMD', 'TMJ pain', 'Jaw pain']),
  condition('tension-headache', 'Tension-type headache', ['head-jaw', 'neck'], ['TTH']),
  condition('cervicogenic-headache', 'Cervicogenic headache', ['neck', 'head-jaw'], ['Neck-related headache']),
  condition('neck-pain', 'Neck pain with mobility deficits', ['neck'], ['Mechanical neck pain', 'Stiff neck']),
  condition('whiplash', 'Whiplash-associated disorder', ['neck'], ['WAD']),
  condition('cervical-radiculopathy', 'Neck pain with radiating arm pain', ['neck', 'shoulder', 'elbow', 'wrist-hand'], ['Cervical radiculopathy', 'Neck-arm pain'], ['acdf']),
  condition('thoracic-pain', 'Thoracic spine pain', ['thoracic'], ['Mid-back pain']),
  condition('shoulder-pain', 'Rotator cuff related shoulder pain', ['shoulder'], ['Subacromial pain', 'Impingement', 'Rotator cuff tendinopathy'], ['rotator-cuff-repair']),
  condition('frozen-shoulder', 'Frozen shoulder (adhesive capsulitis)', ['shoulder'], ['Adhesive capsulitis']),
  condition('lateral-elbow', 'Lateral elbow pain (tennis elbow)', ['elbow'], ['Lateral epicondylalgia', 'Tennis elbow', 'Lateral elbow tendinopathy']),
  condition('medial-elbow', 'Medial elbow pain (golfer’s elbow)', ['elbow'], ['Medial epicondylalgia']),
  condition('carpal-tunnel', 'Carpal tunnel syndrome', ['wrist-hand'], ['CTS'], ['carpal-tunnel-release']),
  condition('wrist-stiffness', 'Wrist stiffness after fracture or immobilisation', ['wrist-hand'], ['Post-fracture stiffness'], ['distal-radius-fracture-cast', 'distal-radius-fracture-orif', 'scaphoid-fracture-cast']),
  condition('thumb-cmc-oa', 'Thumb base (CMC) osteoarthritis', ['wrist-hand'], ['Thumb arthritis']),
  condition('acute-lbp', 'Acute low back pain', ['lumbar'], ['Lumbago']),
  condition('chronic-lbp', 'Chronic low back pain', ['lumbar'], ['Persistent low back pain']),
  condition('lumbar-radiculopathy', 'Low back pain with leg pain', ['lumbar', 'hip', 'knee', 'ankle-foot'], ['Sciatica', 'Lumbar radiculopathy'], ['lumbar-discectomy']),
  condition('pelvic-girdle-pain', 'Pelvic girdle / sacroiliac pain', ['pelvis'], ['SIJ pain', 'Sacroiliac joint dysfunction']),
  condition('hip-oa', 'Hip osteoarthritis', ['hip'], ['Hip arthritis'], ['tha-posterior', 'tha-anterior']),
  condition('gluteal-pain', 'Lateral hip / gluteal pain', ['hip'], ['Greater trochanteric pain syndrome', 'Gluteal tendinopathy', 'Deep gluteal syndrome', 'Piriformis syndrome']),
  condition('knee-oa', 'Knee osteoarthritis', ['knee'], ['Knee arthritis'], ['tka']),
  condition('patellofemoral-pain', 'Patellofemoral pain', ['knee'], ['PFP', 'Anterior knee pain']),
  condition('knee-stiffness', 'Knee stiffness after surgery or immobilisation', ['knee'], ['Arthrofibrosis'], ['tka', 'aclr', 'patella-fracture-orif', 'tibial-plateau-fracture']),
  condition('hamstring-tightness', 'Reduced hamstring flexibility', ['knee', 'hip'], ['Tight hamstrings']),
  condition('ankle-sprain', 'Lateral ankle sprain', ['ankle-foot'], ['Inversion sprain'], ['brostrom']),
  condition('ankle-instability', 'Chronic ankle instability', ['ankle-foot'], ['CAI', 'Recurrent sprains'], ['brostrom']),
  condition('ankle-stiffness', 'Ankle stiffness after fracture or immobilisation', ['ankle-foot'], ['Limited dorsiflexion'], ['ankle-fracture-orif', 'ankle-fracture-non-operative']),
  condition('achilles-tendinopathy', 'Achilles tendinopathy', ['ankle-foot'], ['Achilles tendinitis']),
  condition('plantar-heel-pain', 'Plantar heel pain (plantar fasciitis)', ['ankle-foot'], ['Plantar fasciitis', 'Plantar fasciopathy']),
  condition('swelling', 'Swelling and bruising after injury or surgery', ['knee', 'ankle-foot', 'elbow', 'wrist-hand', 'shoulder'], ['Oedema', 'Haematoma']),
];
