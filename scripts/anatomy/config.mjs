/**
 * Build inputs for the 3D models: which Z-Anatomy meshes belong to which app muscle / bone, and
 * which part of the skeleton each regional model shows.
 *
 * Source: Z-Anatomy (https://github.com/LluisV/Z-Anatomy), itself derived from BodyParts3D.
 * Licence: CC BY-SA 4.0 (Z-Anatomy) and CC BY-SA 2.1 JP (BodyParts3D). Pinned to one commit so
 * rebuilding always gives the same models.
 */
import { HEAD_NECK_MESHES } from './meshes/head-neck.mjs';
import { LOWER_LIMB_MESHES } from './meshes/lower-limb.mjs';
import { TRUNK_PELVIS_MESHES } from './meshes/trunk-pelvis.mjs';
import { UPPER_LIMB_MESHES } from './meshes/upper-limb.mjs';

export const Z_ANATOMY_COMMIT = '6c7f9016bd5899ac8edafd31b9900c151df42ed6';
const RAW = `https://raw.githubusercontent.com/LluisV/Z-Anatomy/${Z_ANATOMY_COMMIT}/Resources/Models`;
export const SOURCE_FILES = {
  muscles: { url: `${RAW}/FBX/MuscularSystem100.fbx`, file: 'MuscularSystem100.fbx' },
  skeleton: { url: `${RAW}/FBX/SkeletalSystem100.fbx`, file: 'SkeletalSystem100.fbx' },
  license: { url: `${RAW}/License.txt`, file: 'License.txt' },
};

/**
 * Z-Anatomy mesh name (without the trailing side letter "r"/"l") → app bone id.
 * Bones not listed here are still drawn for context, but nothing attaches to them in the app.
 */
export const BONE_RULES = [
  [/^Clavicle$/, 'clavicle'],
  [/^Scapula$/, 'scapula'],
  [/^Humerus$/, 'humerus'],
  [/^Radius$/, 'radius'],
  [/^Ulna$/, 'ulna'],
  [/^Scaphoid_bone$/, 'scaphoid'],
  [/^Lunate_bone$/, 'lunate'],
  [/^Triquetrum_bone$/, 'triquetrum'],
  [/^Pisiform_bone$/, 'pisiform'],
  [/^Trapezium_bone$/, 'trapezium'],
  [/^Trapezoid_bone$/, 'trapezoid'],
  [/^Capitate_bone$/, 'capitate'],
  [/^Hamate_bone$/, 'hamate'],
  [/_metacarpal_bone$/, 'metacarpals'],
  [/phalanx_of_.*_finger_of_hand$/, 'phalanges-hand'],
  [/^(Manubrium_of_sternum|Body_of_sternum|Xiphoid_process)$/, 'sternum'],
  [/(_rib|^Costal_cartilage_of_.*_rib)$/, 'ribs'],
  [/^(Atlas_\(C1\)|Axis_\(C2\)|Vertebra_C\d)$/, 'cervical-vertebrae'],
  [/^Vertebra_T\d+$/, 'thoracic-vertebrae'],
  [/^Vertebra_L\d$/, 'lumbar-vertebrae'],
  [/^Sacrum$/, 'sacrum'],
  [/^Coccyx$/, 'coccyx'],
  [/^Hip_bone$/, 'hip-bone'],
  [/^Femur$/, 'femur'],
  [/^Patella$/, 'patella'],
  [/^Tibia$/, 'tibia'],
  [/^Fibula$/, 'fibula'],
  [/^Talus$/, 'talus'],
  [/^Calcaneus$/, 'calcaneus'],
  [/^Navicular_bone$/, 'navicular'],
  [/^Cuboid_bone$/, 'cuboid'],
  [/_cuneiform_bone$/, 'cuneiforms'],
  [/_metatarsal_bone$/, 'metatarsals'],
  [/phalanx_of_.*_finger_of_foot$/, 'phalanges-foot'],
  [/^Occipital_bone$/, 'occipital'],
  [/^Temporal_bone$/, 'temporal'],
  [/^Parietal_bone$/, 'parietal'],
  [/^Frontal_bone$/, 'frontal'],
  [/^Sphenoid_bone$/, 'sphenoid'],
  [/^Zygomatic_bone$/, 'zygomatic'],
  [/^Maxilla$/, 'maxilla'],
  [/^Mandible$/, 'mandible'],
  [/^Nasal_bone$/, 'nasal'],
  [/^Hyoid_bone$/, 'hyoid'],
  [/^Thyroid_cartilage$/, 'thyroid-cartilage'],
];

/** Skeleton meshes that are bones (the skeleton file also holds landmarks and attachment areas). */
export const BONE_NAME =
  /bone|Vertebra|_rib$|^Costal_cartilage|sternum|Xiphoid|phalanx|Sacrum|Coccyx|Mandible|Maxilla|Atlas|Axis|Clavicle|Scapula|Humerus|Radius|Ulna|Femur|Patella|Tibia|Fibula|Talus|Calcaneus|Thyroid_cartilage|Cricoid_cartilage/;

/** Never drawn: ear ossicles, sinuses and other internal pieces that only add triangles. */
export const ALWAYS_EXCLUDE = /^(Incus|Malleus|Stapes|Nasal_septal_cartilage|Sinus_of_.*|.*cells_of_ethmoid_bone|Sesamoid_bones_of_foot)$/;

/**
 * One model per region. The skeleton window keeps the bones around the region (cm, model Y up,
 * right side is -x); `maxAbsX` drops the arms hanging beside the trunk and legs.
 */
export const REGION_MODELS = {
  'upper-limb': { skeleton: { minTop: 65, exclude: /^Femur$/ }, muscles: UPPER_LIMB_MESHES },
  'lower-limb': { skeleton: { maxBottom: 112, maxAbsX: 18 }, muscles: LOWER_LIMB_MESHES },
  'trunk-pelvis': { skeleton: { minTop: 78, maxBottom: 150, maxAbsX: 18 }, muscles: TRUNK_PELVIS_MESHES },
  'head-neck': { skeleton: { minTop: 122, maxAbsX: 18 }, muscles: HEAD_NECK_MESHES },
};

/** Muscles in the app that no open 3D atlas models; they are shown without images. */
export const MUSCLES_WITHOUT_MESH = [
  'palmaris-brevis',
  'puborectalis',
  'external-urethral-sphincter',
  'bulbospongiosus',
  'ischiocavernosus',
  'superficial-transverse-perineal',
  'deep-transverse-perineal',
];
