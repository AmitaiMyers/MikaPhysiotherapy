/**
 * App nerve id → Z-Anatomy nervous-system meshes (names without the trailing side letter). A nerve
 * that branches is drawn with its branches, as the app lists them under it. An empty list means the
 * model has no mesh for that nerve; its picture then shows only the muscles it supplies.
 *
 * Approximations: the tibial and common fibular parts of the sciatic nerve run inside one sheath, so
 * both show the sciatic nerve; C1 fibres travel with the hypoglossal nerve; the cervical ventral rami
 * are drawn as the roots of the brachial plexus (C5–T1), the part of them the model has.
 */
const RADIAL_DEEP = ['Deep_branch_of_radial_nerve', 'Posterior_interosseous_nerve_of_forearm'];
const MEDIAN_DIGITAL = ['Common_palmar_digital_branches_of_median_nerve', 'Proper_palmar_digital_branches_of_median_nerve'];
const ULNAR_SUPERFICIAL = ['Superficial_branch_of_ulnar_nerve', 'Common_palmar_digital_branches_of_ulnar_nerve', 'Proper_palmar_digital_branches_of_ulnar_nerve'];
const DEEP_FIBULAR = ['Deep_fibular_nerve', 'Muscular_branches_of_deep_fibular_nerve', 'Dorsal_digital_branches_of_deep_fibular_nerve'];
const SUPERFICIAL_FIBULAR = ['Superficial_fibular_nerve', 'Medial_dorsal_cutaneous_nerve_of_foot', 'Intermediate_dorsal_cutaneous_nerve_of_foot', 'Dorsal_digital_branches_of_superficial_fibular_nerve'];
const MEDIAL_PLANTAR = ['Medial_plantar_nerve', 'Common_plantar_digital_branches_of_medial_plantar_nerve', 'Proper_plantar_digital_branches_of_medial_plantar_nerve'];
const LATERAL_PLANTAR = ['Lateral_plantar_nerve', 'Common_plantar_digital_branches_of_lateral_plantar_nerve', 'Proper_plantar_digital_branches_of_lateral_plantar_nerve'];

export const NERVE_MESHES: Record<string, string[]> = {
  accessory: ['Accessory_nerve_(XI)'],
  'cervical-c3-c4': [],
  'dorsal-scapular': ['Dorsal_scapular_nerve'],
  'long-thoracic': ['Long_thoracic_nerve'],
  suprascapular: ['Suprascapular_nerve'],
  'nerve-to-subclavius': ['Subclavian_nerve'],
  'lateral-pectoral': ['Lateral_pectoral_nerve'],
  'medial-pectoral': ['Medial_pectoral_nerve'],
  'upper-subscapular': ['Superior_subscapular_nerve'],
  thoracodorsal: ['Thoracodorsal_nerve'],
  'lower-subscapular': ['Inferior_subscapular_nerve'],
  axillary: ['Axillary_nerve', 'Muscular_branches_of_axillary_nerve', 'Superior_lateral_brachial_cutaneous_nerve'],
  musculocutaneous: ['Musculocutaneous_nerve', 'Lateral_antebrachial_cutaneous_nerve'],
  radial: ['Radial_nerve', 'Muscular_branches_of_radial_nerve', ...RADIAL_DEEP, 'Superficial_branch_of_radial_nerve', 'Dorsal_digital_branches_of_radial_nerve', 'Posterior_antebrachial_cutaneous_nerve', 'Inferior_lateral_brachial_cutaneous_nerve'],
  'posterior-interosseous': RADIAL_DEEP,
  median: ['Median_nerve', 'Muscular_branches_of_median_nerve', 'Anterior_interosseous_nerve_of_forearm', 'Palmar_branch_of_median_nerve', ...MEDIAN_DIGITAL],
  'anterior-interosseous': ['Anterior_interosseous_nerve_of_forearm'],
  'median-recurrent': [],
  'median-digital': MEDIAN_DIGITAL,
  ulnar: ['Ulnar_nerve', 'Muscular_branches_of_ulnar_nerve', 'Dorsal_branch_of_ulnar_nerve', 'Palmar_branch_of_ulnar_nerve', 'Deep_branch_of_ulnar_nerve', 'Dorsal_digital_branches_of_ulnar_nerve', ...ULNAR_SUPERFICIAL],
  'ulnar-deep': ['Deep_branch_of_ulnar_nerve'],
  'ulnar-superficial': ULNAR_SUPERFICIAL,
  'lumbar-ventral-rami': [],
  femoral: ['Femoral_nerve', 'Anterior_cutaneous_branches_of_femoral_nerve', 'Saphenous_nerve', 'Infrapatellar_branch_of_saphenous_nerve', 'Medial_crural_cutaneous_branches_of_saphenous_nerve'],
  obturator: ['Obturator_nerve', 'Anterior_branch_of_obturator_nerve', 'Posterior_branch_of_obturator_nerve'],
  'superior-gluteal': ['Superior_gluteal_nerve'],
  'inferior-gluteal': [],
  'nerve-to-piriformis': ['Nerve_to_piriformis_muscle'],
  'nerve-to-obturator-internus': [],
  'nerve-to-quadratus-femoris': ['Nerve_to_quadratus_femoris_muscle'],
  sciatic: ['Sciatic_nerve'],
  'sciatic-tibial': ['Sciatic_nerve'],
  'sciatic-fibular': ['Sciatic_nerve'],
  tibial: ['Tibial_nerve', 'Medial_sural_cutaneous_nerve', 'Sural_nerve', ...MEDIAL_PLANTAR, ...LATERAL_PLANTAR],
  'common-fibular': ['Common_fibular_nerve', 'Sural_communicating_branch_of_common_fibular_nerve', ...DEEP_FIBULAR, ...SUPERFICIAL_FIBULAR],
  'deep-fibular': DEEP_FIBULAR,
  'superficial-fibular': SUPERFICIAL_FIBULAR,
  'medial-plantar': MEDIAL_PLANTAR,
  'lateral-plantar': LATERAL_PLANTAR,
  'dorsal-rami': [],
  intercostal: ['Intercostal_nerves'],
  'iliohypogastric-ilioinguinal': ['Iliohypogastric_nerve', 'Ilio-inguinal_nerve'],
  phrenic: [],
  'nerve-to-levator-ani': [],
  pudendal: ['Pudendal_nerve'],
  'inferior-rectal': [],
  'perineal-nerve': [],
  'cervical-ventral-rami': ['Roots_of_brachial_plexus'],
  'ansa-cervicalis': [],
  'c1-via-hypoglossal': ['Hypoglossal_nerve_(XII)'],
  'suboccipital-nerve': [],
  mandibular: ['Anterior_division_of_mandibular_nerve', 'Posterior_division_of_mandibular_nerve', 'Inferior_alveolar_nerve', 'Lingual_nerve', 'Buccal_nerve', 'Mental_nerve', 'Nerve_to_mylohyoid_muscle'],
  facial: ['Facial_nerve_(VII)', 'Chorda_tympani'],
};

/** Other peripheral nerves drawn faintly for context: the brachial plexus and the cutaneous nerves. */
export const CONTEXT_NERVE = /brachial_plexus|cutaneous|genitofemoral|Genital_branch|Femoral_branch|Communicating_branch/i;
