/** App muscle id → Z-Anatomy muscle meshes and attachment-area base names (see upper-limb.mjs). */

/** Shorthand for a muscle whose mesh and attachment areas share one Z-Anatomy name. */
const same = (name, ...extraAttachments) => ({ meshes: [name], attachments: [name, ...extraAttachments] });

export const HEAD_NECK_MESHES = {
  sternocleidomastoid: same('Sternocleidomastoid_muscle'),
  platysma: same('Platysma'),
  'scalenus-anterior': same('Scalenus_anterior_muscle'),
  'scalenus-medius': same('Scalenus_medius_muscle'),
  'scalenus-posterior': same('Scalenus_posterior_muscle'),
  digastric: {
    meshes: ['Anterior_belly_of_digastric_muscle', 'Posterior_belly_of_digastric_muscle', 'Intermediate_tendon_of_digastric_muscle'],
    attachments: ['Anterior_belly_of_digastric_muscle', 'Posterior_belly_of_digastric_muscle', 'Digastric_muscle'],
  },
  mylohyoid: same('Mylohyoid_muscle'),
  geniohyoid: same('Geniohyoid_muscle'),
  stylohyoid: same('Stylohyoid_muscle'),
  sternohyoid: same('Sternohyoid_muscle'),
  sternothyroid: same('Sternothyroid_muscle'),
  thyrohyoid: same('Thyrohyoid_muscle'),
  omohyoid: same('Omohyoid_muscle'),
  'longus-colli': same('Longus_colli_muscle'),
  'longus-capitis': same('Longus_capitis_muscle'),
  'rectus-capitis-anterior': same('Rectus_anterior_capitis_muscle'),
  'rectus-capitis-lateralis': same('Rectus_lateralis_capitis_muscle'),
  'rectus-capitis-posterior-major': same('Rectus_posterior_major_capitis_muscle'),
  'rectus-capitis-posterior-minor': same('Rectus_posterior_minor_capitis_muscle'),
  'obliquus-capitis-superior': same('Obliquus_superior_capitis_muscle'),
  'obliquus-capitis-inferior': same('Obliquus_inferior_capitis_muscle'),
  'splenius-capitis': same('Splenius_capitis_muscle'),
  'splenius-cervicis': same('Splenius_colli_muscle'),
  'semispinalis-cervicis': same('Semispinalis_colli_muscle'),
  masseter: { meshes: ['Superficial_part_of_masseter', 'Deep_part_of_masseter'], attachments: ['Masseter'] },
  temporalis: same('Temporalis_muscle'),
  'medial-pterygoid': same('Medial_pterygoid_muscle'),
  'lateral-pterygoid': {
    meshes: ['Superior_head_of_lateral_pterygoid_muscle', 'Inferior_head_of_lateral_pterygoid_muscle'],
    attachments: ['Lateral_pterygoid_muscle'],
  },
  occipitofrontalis: { meshes: ['Frontalis_muscle', 'Occipitalis_muscle'], attachments: ['Frontalis_muscle', 'Occipitalis_muscle'] },
  'corrugator-supercilii': same('Corrugator_supercilii'),
  'orbicularis-oculi': {
    meshes: ['Orbital_part_of_orbicularis_oculi', 'Palpebral_part_of_orbicularis_oculi'],
    attachments: ['Orbital_part_of_orbicularis_oculi', 'Palpebral_part_of_orbicularis_oculi'],
  },
  nasalis: same('Nasalis_muscle'),
  'levator-labii-superioris': same('Levator_labii_superioris'),
  'zygomaticus-major': same('Zygomaticus_major_muscle'),
  'orbicularis-oris': same('Orbicularis_oris_muscle'),
  buccinator: same('Bucinator'),
  'depressor-anguli-oris': same('Depressor_anguli_oris'),
  mentalis: same('Mentalis_muscle'),
};
