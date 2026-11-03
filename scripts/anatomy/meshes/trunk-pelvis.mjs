/** App muscle id → Z-Anatomy muscle meshes and attachment-area base names (see upper-limb.mjs). */

/** Shorthand for a muscle whose mesh and attachment areas share one Z-Anatomy name. */
const same = (name, ...extraAttachments) => ({ meshes: [name], attachments: [name, ...extraAttachments] });

/** Common tendon of erector spinae on the sacrum and iliac crest. */
const ERECTOR_SPINAE_TENDON = 'Erector_spinae';

export const TRUNK_PELVIS_MESHES = {
  'serratus-posterior-superior': same('Serratus_posterior_superior_muscle'),
  'serratus-posterior-inferior': same('Serratus_posterior_inferior_muscle'),
  iliocostalis: {
    meshes: ['Iliocostalis_lumborum_muscle', 'Iliocostalis_thoracis_muscle', 'Iliocostalis_colli_muscle'],
    attachments: ['Iliocostalis_lumborum_muscle', 'Iliocostalis_thoracis_muscle', 'Iliocostalis_colli_muscle', ERECTOR_SPINAE_TENDON],
  },
  longissimus: {
    meshes: ['Longissimus_thoracis_muscle', 'Longissimus_colli_muscle', 'Longissimus_capitis_muscle'],
    attachments: ['Longissimus_thoracis_muscle', 'Longissimus_colli_muscle', 'Longissimus_capitis_muscle', ERECTOR_SPINAE_TENDON],
  },
  spinalis: { meshes: ['Spinalis_thoracis_muscle', 'Spinalis_colli_muscle'], attachments: ['Spinalis_thoracis_muscle', 'Spinalis_colli_muscle'] },
  'semispinalis-thoracis': same('Semispinalis_thoracis_muscle'),
  multifidus: {
    meshes: ['Multifidus_lumborum_muscle', 'Multifidus_thoracis_muscle', 'Multifidus_colli_muscle'],
    attachments: ['Multifidus_lumborum_muscle', 'Multifidus_thoracis_muscle', 'Multifidus_colli_muscle'],
  },
  rotatores: same('Rotatores'),
  'quadratus-lumborum': same('Quadratus_lumborum_muscle'),
  // One muscle that Z-Anatomy splits into halves: draw both.
  diaphragm: { ...same('Diaphragm'), bothSides: true },
  'external-intercostals': same('External_intercostal_muscles'),
  'internal-intercostals': same('Internal_intercostal_muscles'),
  'rectus-abdominis': same('Rectus_abdominis_muscle'),
  'external-oblique': same('External_abdominal_oblique_muscle'),
  'internal-oblique': same('Internal_abdominal_oblique_muscle'),
  'transversus-abdominis': same('Transversus_abdominis_muscle'),
  pyramidalis: same('Pyramidalis_muscle'),
  pubococcygeus: { meshes: ['Pubococcygeus_muscle', 'Pubo-analis_muscle'], attachments: ['Pubococcygeus_muscle', 'Levator_ani'] },
  iliococcygeus: same('Iliococcygeus_muscle', 'Levator_ani'),
  coccygeus: same('Coccygeus_muscle'),
  'external-anal-sphincter': same('External_anal_sphincter'),
};
