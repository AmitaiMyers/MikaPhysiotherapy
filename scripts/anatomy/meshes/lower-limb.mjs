/** App muscle id → Z-Anatomy muscle meshes and attachment-area base names (see upper-limb.mjs). */

/** Shorthand for a muscle whose mesh and attachment areas share one Z-Anatomy name. */
const same = (name, ...extraAttachments) => ({ meshes: [name], attachments: [name, ...extraAttachments] });

const QUADRICEPS_TENDON = 'Quadriceps_femoris_muscle';
const CALCANEAL_TENDON = 'Triceps_surae_muscle';
const ILIOPSOAS_TENDON = 'Iliopsoas_muscle';

export const LOWER_LIMB_MESHES = {
  'gluteus-maximus': same('Gluteus_maximus_muscle'),
  'gluteus-medius': same('Gluteus_medius_muscle'),
  'gluteus-minimus': same('Gluteus_minimus_muscle'),
  'tensor-fasciae-latae': same('Tensor_fasciae_latae'),
  piriformis: same('Piriformis_muscle'),
  'superior-gemellus': same('Superior_gemellus_muscle'),
  'obturator-internus': same('Obturator_internus'),
  'inferior-gemellus': same('Inferior_gemellus_muscle'),
  'quadratus-femoris': same('Quadratus_femoris_muscle'),
  'psoas-major': { meshes: ['Psoas_major'], attachments: [ILIOPSOAS_TENDON] },
  iliacus: same('Iliacus_muscle', ILIOPSOAS_TENDON),
  sartorius: same('Sartorius_muscle'),
  'rectus-femoris': same('Rectus_femoris_muscle', QUADRICEPS_TENDON),
  'vastus-lateralis': same('Vastus_lateralis_muscle', QUADRICEPS_TENDON),
  'vastus-medialis': same('Vastus_medialis_muscle', QUADRICEPS_TENDON),
  'vastus-intermedius': same('Vastus_intermedius_muscle', QUADRICEPS_TENDON),
  pectineus: same('Pectineus_muscle'),
  'adductor-longus': same('Adductor_longus'),
  'adductor-brevis': same('Adductor_brevis'),
  'adductor-magnus': { meshes: ['Adductor_magnus', '(Adductor_minimus)'], attachments: ['Adductor_magnus'] },
  gracilis: same('Gracilis_muscle'),
  'obturator-externus': same('Obturator_externus'),
  'biceps-femoris': {
    meshes: ['Long_head_of_biceps_femoris', 'Short_head_of_biceps_femoris'],
    attachments: ['Biceps_femoris_muscle', 'Long_head_of_biceps_femoris', 'Short_head_of_biceps_femoris'],
  },
  semitendinosus: same('Semitendinosus_muscle'),
  semimembranosus: same('Semimembranosus_muscle'),
  'tibialis-anterior': same('Tibialis_anterior_muscle'),
  'extensor-hallucis-longus': same('Extensor_hallucis_longus'),
  'extensor-digitorum-longus': { meshes: ['Extensor_digitorum_longus', 'Tendon_of_extensor_digitorum_longus'], attachments: ['Extensor_digitorum_longus'] },
  'fibularis-tertius': same('Fibularis_tertius_muscle'),
  'fibularis-longus': same('Fibularis_longus_muscle'),
  'fibularis-brevis': same('Fibularis_brevis_muscle'),
  gastrocnemius: {
    meshes: ['Medial_head_of_gastrocnemius', 'Lateral_head_of_gastrocnemius'],
    attachments: ['Medial_head_of_gastrocnemius', 'Lateral_head_of_gastrocnemius', CALCANEAL_TENDON],
  },
  soleus: same('Soleus_muscle', CALCANEAL_TENDON),
  plantaris: same('Plantaris_muscle'),
  popliteus: same('Popliteus_muscle'),
  'flexor-hallucis-longus': same('Flexor_hallucis_longus'),
  'flexor-digitorum-longus': same('Flexor_digitorum_longus'),
  'tibialis-posterior': same('Tibialis_posterior_muscle'),
  'extensor-digitorum-brevis': same('Extensor_digitorum_brevis'),
  'extensor-hallucis-brevis': same('Extensor_hallucis_brevis'),
  'abductor-hallucis': same('Abductor_hallucis'),
  'flexor-digitorum-brevis': same('Flexor_digitorum_brevis'),
  'abductor-digiti-minimi-foot': same('Abductor_digiti_minimi_of_foot'),
  'quadratus-plantae': same('Quadratus_plantae_muscle'),
  'lumbricals-foot': same('Lumbrical_muscles_of_foot'),
  'flexor-hallucis-brevis': {
    meshes: ['Medial_head_of_flexor_hallucis_brevis', 'Lateral_head_of_flexor_hallucis_brevis'],
    attachments: ['Medial_head_of_flexor_hallucis_brevis', 'Lateral_head_of_flexor_hallucis_brevis'],
  },
  'adductor-hallucis': {
    meshes: ['Oblique_head_of_adductor_hallucis', 'Transverse_head_of_adductor_hallucis'],
    attachments: ['Oblique_head_of_adductor_hallucis', 'Transverse_head_of_adductor_hallucis'],
  },
  'flexor-digiti-minimi-brevis-foot': same('Flexor_digiti_minimi_of_foot'),
  'plantar-interossei': same('Plantar_interossei_muscles'),
  'dorsal-interossei-foot': same('Dorsal_interossei_muscles_of_foot'),
};
