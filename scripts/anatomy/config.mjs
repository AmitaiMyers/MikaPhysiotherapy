/**
 * Build inputs for the 3D model: which Z-Anatomy meshes belong to which app muscle / bone.
 *
 * Source: Z-Anatomy (https://github.com/LluisV/Z-Anatomy), itself derived from BodyParts3D.
 * Licence: CC BY-SA 4.0 (Z-Anatomy) and CC BY-SA 2.1 JP (BodyParts3D). Pinned to one commit so
 * rebuilding always gives the same model.
 */

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
  [/^Hip_bone$/, 'hip-bone'],
  [/^Occipital_bone$/, 'occipital'],
];

/** Skeleton meshes drawn for context: everything reaching above this height (cm; fingertips are at about 70) except these. */
export const CONTEXT_MIN_Y = 65;
export const CONTEXT_EXCLUDE = /^(Femur|Incus|Malleus|Stapes|Nasal_septal_cartilage|Sinus_of_.*|Hyoid_bone|Thyroid_cartilage|Cricoid_cartilage)$/;

/**
 * App muscle id → Z-Anatomy muscle meshes (right side) and the base names of its attachment-area
 * meshes in the skeleton file. Attachment areas are classified as origin or insertion by the
 * bone they lie on, using the app's own origin/insertion data (Z-Anatomy's o/e suffixes are not
 * consistent, e.g. serratus anterior is reversed).
 */
export const MUSCLE_MESHES = {
  'pectoralis-major': {
    meshes: ['Clavicular_head_of_pectoralis_major_muscle', 'Sternocostal_head_of_pectoralis_major_muscle', '(Abdominal_part_of_pectoralis_major_muscle)'],
    attachments: ['Pectoralis_major_muscle', 'Sternocostal_head_of_pectoralis_major_muscle', '(Abdominal_part_of_pectoralis_major_muscle)'],
  },
  'pectoralis-minor': { meshes: ['Pectoralis_minor_muscle'], attachments: ['Pectoralis_minor_muscle'] },
  subclavius: { meshes: ['Subclavius_muscle'], attachments: ['Subclavius_muscle'] },
  'serratus-anterior': { meshes: ['Serratus_anterior_muscle'], attachments: ['Serratus_anterior_muscle'] },
  trapezius: {
    meshes: ['Descending_part_of_trapezius_muscle', 'Transverse_part_of_trapezius_muscle', 'Ascending_part_of_trapezius_muscle'],
    attachments: ['Descending_part_of_trapezius_muscle', 'Transverse_part_of_trapezius_muscle', 'Ascending_part_of_trapezius_muscle'],
  },
  'latissimus-dorsi': { meshes: ['Latissimus_dorsi_muscle'], attachments: ['Latissimus_dorsi_muscle'] },
  'levator-scapulae': { meshes: ['Levator_scapulae'], attachments: ['Levator_scapulae'] },
  'rhomboid-major': { meshes: ['Rhomboid_major_muscle'], attachments: ['Rhomboid_major_muscle'] },
  'rhomboid-minor': { meshes: ['Rhomboid_minor_muscle'], attachments: ['Rhomboid_minor_muscle'] },
  deltoid: {
    meshes: ['Clavicular_part_of_deltoid_muscle', 'Acromial_part_of_deltoid_muscle', 'Scapular_spinal_part_of_deltoid_muscle'],
    attachments: ['Deltoid_muscle', 'Clavicular_part_of_deltoid_muscle', 'Acromial_part_of_deltoid_muscle', 'Scapular_spinal_part_of_deltoid_muscle'],
  },
  'teres-major': { meshes: ['Teres_major_muscle'], attachments: ['Teres_major_muscle'] },
  supraspinatus: { meshes: ['Supraspinatus_muscle'], attachments: ['Supraspinatus_muscle'] },
  infraspinatus: { meshes: ['Infraspinatus_muscle'], attachments: ['Infraspinatus_muscle'] },
  'teres-minor': { meshes: ['Teres_minor_muscle'], attachments: ['Teres_minor_muscle'] },
  subscapularis: { meshes: ['Subscapularis_muscle'], attachments: ['Subscapularis_muscle'] },
  'biceps-brachii': {
    meshes: ['Long_head_of_biceps_brachii', 'Short_head_of_biceps_brachii'],
    attachments: ['Biceps_brachii_muscle', 'Long_head_of_biceps_brachii', 'Short_head_of_biceps_brachii'],
  },
  brachialis: { meshes: ['Brachialis_muscle'], attachments: ['Brachialis_muscle'] },
  coracobrachialis: { meshes: ['Coracobrachialis_muscle'], attachments: ['Coracobrachialis_muscle'] },
  'triceps-brachii': {
    meshes: ['Long_head_of_triceps_brachii', 'Lateral_head_of_triceps_brachii', 'Medial_head_of_triceps_brachii'],
    attachments: ['Triceps_brachii_muscle', 'Long_head_of_triceps_brachii', 'Lateral_head_of_triceps_brachii', 'Medial_head_of_triceps_brachii'],
  },
  anconeus: { meshes: ['Anconeus_muscle'], attachments: ['Anconeus_muscle'] },
  'pronator-teres': {
    meshes: ['Superficial_head_of_pronator_teres', 'Deep_head_of_pronator_teres'],
    attachments: ['Pronator_teres', 'Common_flexor_tendon'],
  },
  'flexor-carpi-radialis': { meshes: ['Flexor_carpi_radialis'], attachments: ['Flexor_carpi_radialis', 'Common_flexor_tendon'] },
  'palmaris-longus': { meshes: ['Palmaris_longus_muscle'], attachments: ['Palmaris_longus_muscle', 'Common_flexor_tendon'] },
  'flexor-carpi-ulnaris': {
    meshes: ['Humeral_head_of_flexor_carpi_ulnaris', 'Ulnar_head_of_flexor_carpi_ulnaris'],
    attachments: ['Flexor_carpi_ulnaris', 'Ulnar_head_of_flexor_carpi_ulnaris', 'Common_flexor_tendon'],
  },
  'flexor-digitorum-superficialis': {
    meshes: ['Humero-ulnar_head_of_flexor_digitorum_superficialis', 'Radial_head_of_flexor_digitorum_superficialis'],
    attachments: ['Flexor_digitorum_superficialis', 'Common_flexor_tendon'],
  },
  'flexor-digitorum-profundus': { meshes: ['Flexor_digitorum_profundus'], attachments: ['Flexor_digitorum_profundus'] },
  'flexor-pollicis-longus': { meshes: ['Flexor_pollicis_longus'], attachments: ['Flexor_pollicis_longus'] },
  'pronator-quadratus': { meshes: ['Pronator_quadratus'], attachments: ['Pronator_quadratus'] },
  brachioradialis: { meshes: ['Brachioradialis_muscle'], attachments: ['Brachioradialis_muscle'] },
  'extensor-carpi-radialis-longus': { meshes: ['Extensor_carpi_radialis_longus'], attachments: ['Extensor_carpi_radialis_longus'] },
  'extensor-carpi-radialis-brevis': {
    meshes: ['Extensor_carpi_radialis_brevis'],
    attachments: ['Extensor_carpi_radialis_brevis', 'Common_extensor_tendon'],
  },
  'extensor-digitorum': { meshes: ['Extensor_digitorum'], attachments: ['Extensor_digitorum', 'Common_extensor_tendon'] },
  'extensor-digiti-minimi': { meshes: ['Extensor_digiti_minimi'], attachments: ['Extensor_digiti_minimi', 'Common_extensor_tendon'] },
  'extensor-carpi-ulnaris': {
    meshes: ['Humeral_head_of_extensor_carpi_ulnaris', 'Ulnar_head_of_extensor_carpi_ulnaris'],
    attachments: ['Extensor_carpi_ulnaris', 'Common_extensor_tendon'],
  },
  supinator: { meshes: ['Supinator'], attachments: ['Supinator'] },
  'abductor-pollicis-longus': { meshes: ['Abductor_pollicis_longus'], attachments: ['Abductor_pollicis_longus'] },
  'extensor-pollicis-brevis': { meshes: ['Extensor_pollicis_brevis'], attachments: ['Extensor_pollicis_brevis'] },
  'extensor-pollicis-longus': { meshes: ['Extensor_pollicis_longus'], attachments: ['Extensor_pollicis_longus'] },
  'extensor-indicis': { meshes: ['Extensor_indicis'], attachments: ['Extensor_indicis'] },
  'abductor-pollicis-brevis': { meshes: ['Abductor_pollicis_brevis'], attachments: ['Abductor_pollicis_brevis'] },
  'flexor-pollicis-brevis': {
    meshes: ['Superficial_head_of_flexor_pollicis_brevis', 'Deep_head_of_flexor_pollicis_brevis'],
    attachments: ['Flexor_pollicis_brevis', 'Superficial_head_of_flexor_pollicis_brevis', 'Deep_head_of_flexor_pollicis_brevis'],
  },
  'opponens-pollicis': { meshes: ['Opponens_pollicis_muscle'], attachments: ['Opponens_pollicis_muscle'] },
  'adductor-pollicis': {
    meshes: ['Oblique_head_of_adductor_pollicis', 'Transverse_head_of_adductor_pollicis'],
    attachments: ['Adductor_pollicis', 'Oblique_head_of_adductor_pollicis', 'Transverse_head_of_adductor_pollicis'],
  },
  'abductor-digiti-minimi-hand': { meshes: ['Abductor_digiti_minimi_of_hand'], attachments: ['Abductor_digiti_minimi_of_hand'] },
  'flexor-digiti-minimi-brevis-hand': { meshes: ['Flexor_digiti_minimi_of_hand'], attachments: ['Flexor_digiti_minimi_of_hand'] },
  'opponens-digiti-minimi-hand': {
    meshes: ['Opponens_digiti_minimi_muscle_of_hand'],
    attachments: ['Opponens_digiti_minimi_muscle_of_hand'],
  },
  'lumbricals-hand': { meshes: ['Lumbrical_muscles_of_hand'], attachments: ['Lumbrical_muscles_of_hand'] },
  'dorsal-interossei-hand': { meshes: ['Dorsal_interossei_muscles_of_hand'], attachments: ['Dorsal_interossei_muscles_of_hand'] },
  'palmar-interossei': { meshes: ['Palmar_interossei_muscles'], attachments: ['Palmar_interossei_muscles'] },
};

/** Muscles in the app that no open 3D atlas models; they are shown without images. */
export const MUSCLES_WITHOUT_MESH = ['palmaris-brevis'];
