/**
 * App tendon id → where its 3D shape comes from. Most tendons are fused into their muscle's mesh in
 * the atlas, so their end of the muscle is carved off (`carve`): the last `fraction` of the muscle's
 * length at the end lying furthest in `end` (up, down, lateral, medial, front, back; the body's right
 * side). The fractions were set by eye against the 3D model. A few tendons are separate meshes in
 * the atlas muscles model (`atlas`).
 */
const carve = (part, end, options = {}) => ({ part, end, ...options });

export const TENDON_SOURCES = {
  // ---- Lower limb ----
  'achilles-tendon': { atlas: ['Calcaneal_tendon'] },
  'quadriceps-tendon': { carve: [carve('Rectus_femoris_muscle', 'down', { fraction: 0.12 }), carve('Vastus_medialis_muscle', 'down', { fraction: 0.08 }), carve('Vastus_lateralis_muscle', 'down', { fraction: 0.08 })] },
  'rectus-femoris-proximal-tendon': { carve: [carve('Rectus_femoris_muscle', 'up', { fraction: 0.1 })] },
  'proximal-hamstring-tendon': { carve: [carve('Long_head_of_biceps_femoris', 'up', { fraction: 0.12 }), carve('Semitendinosus_muscle', 'up', { fraction: 0.1 }), carve('Semimembranosus_muscle', 'up', { fraction: 0.2 })] },
  'distal-biceps-femoris-tendon': { carve: [carve('Long_head_of_biceps_femoris', 'down', { fraction: 0.15 })] },
  'semimembranosus-distal-tendon': { carve: [carve('Semimembranosus_muscle', 'down', { fraction: 0.12 })] },
  'pes-anserinus': { carve: [carve('Sartorius_muscle', 'down', { fraction: 0.1 }), carve('Gracilis_muscle', 'down', { fraction: 0.18 }), carve('Semitendinosus_muscle', 'down', { fraction: 0.3 })] },
  'iliotibial-band': { carve: [carve('Tensor_fasciae_latae', 'down', { fraction: 0.6 })] },
  'gluteus-medius-tendon': { carve: [carve('Gluteus_medius_muscle', 'lateral', { fraction: 0.15 })] },
  'gluteus-minimus-tendon': { carve: [carve('Gluteus_minimus_muscle', 'lateral', { fraction: 0.15 })] },
  'iliopsoas-tendon': { carve: [carve('Psoas_major', 'down', { fraction: 0.12 }), carve('Iliacus_muscle', 'down', { fraction: 0.15 })] },
  'adductor-longus-tendon': { carve: [carve('Adductor_longus', 'up', { fraction: 0.12 })] },
  'popliteus-tendon': { carve: [carve('Popliteus_muscle', 'up', { fraction: 0.3 })] },
  'tibialis-posterior-tendon': { carve: [carve('Tibialis_posterior_muscle', 'down', { fraction: 0.3 })] },
  'tibialis-anterior-tendon': { carve: [carve('Tibialis_anterior_muscle', 'down', { fraction: 0.35 })] },
  'fibularis-longus-tendon': { carve: [carve('Fibularis_longus_muscle', 'down', { fraction: 0.45 })] },
  'fibularis-brevis-tendon': { carve: [carve('Fibularis_brevis_muscle', 'down', { fraction: 0.3 })] },
  'flexor-hallucis-longus-tendon': { carve: [carve('Flexor_hallucis_longus', 'down', { fraction: 0.4 })] },
  'flexor-digitorum-longus-tendon': { carve: [carve('Flexor_digitorum_longus', 'down', { fraction: 0.45 })] },
  'extensor-hallucis-longus-tendon': { carve: [carve('Extensor_hallucis_longus', 'down', { fraction: 0.45 })] },
  'extensor-digitorum-longus-tendon': { atlas: ['Tendon_of_extensor_digitorum_longus'] },
  'plantaris-tendon': { carve: [carve('Plantaris_muscle', 'down', { fraction: 0.75 })] },
  // ---- Upper limb ----
  'supraspinatus-tendon': { carve: [carve('Supraspinatus_muscle', 'lateral', { fraction: 0.18 })] },
  'infraspinatus-tendon': { carve: [carve('Infraspinatus_muscle', 'lateral', { fraction: 0.15 })] },
  'teres-minor-tendon': { carve: [carve('Teres_minor_muscle', 'lateral', { fraction: 0.15 })] },
  'subscapularis-tendon': { carve: [carve('Subscapularis_muscle', 'lateral', { fraction: 0.15 })] },
  'long-head-biceps-tendon': { carve: [carve('Long_head_of_biceps_brachii', 'up', { fraction: 0.35 })] },
  'distal-biceps-tendon': { carve: [carve('Long_head_of_biceps_brachii', 'down', { fraction: 0.12 }), carve('Short_head_of_biceps_brachii', 'down', { fraction: 0.12 })] },
  'triceps-tendon': { carve: [carve('Long_head_of_triceps_brachii', 'down', { fraction: 0.12 }), carve('Lateral_head_of_triceps_brachii', 'down', { fraction: 0.15 }), carve('Medial_head_of_triceps_brachii', 'down', { fraction: 0.1 })] },
  'pectoralis-major-tendon': { carve: [carve('Sternocostal_head_of_pectoralis_major_muscle', 'lateral', { fraction: 0.12 }), carve('Clavicular_head_of_pectoralis_major_muscle', 'lateral', { fraction: 0.12 })] },
  'latissimus-dorsi-tendon': { carve: [carve('Latissimus_dorsi_muscle', 'up', { fraction: 0.07 })] },
  'common-extensor-tendon': { carve: [carve('Extensor_carpi_radialis_brevis', 'up', { fraction: 0.12 }), carve('Extensor_digitorum', 'up', { fraction: 0.08 }), carve('Humeral_head_of_extensor_carpi_ulnaris', 'up', { fraction: 0.08 }), carve('Extensor_digiti_minimi', 'up', { fraction: 0.08 })] },
  'common-flexor-tendon': { carve: [carve('Flexor_carpi_radialis', 'up', { fraction: 0.08 }), carve('Palmaris_longus_muscle', 'up', { fraction: 0.06 }), carve('Humero-ulnar_head_of_flexor_digitorum_superficialis', 'up', { fraction: 0.06 }), carve('Humeral_head_of_flexor_carpi_ulnaris', 'up', { fraction: 0.08 })] },
  'first-dorsal-compartment-tendons': { carve: [carve('Abductor_pollicis_longus', 'down', { fraction: 0.35 }), carve('Extensor_pollicis_brevis', 'down', { fraction: 0.4 })] },
  'extensor-pollicis-longus-tendon': { carve: [carve('Extensor_pollicis_longus', 'down', { fraction: 0.5 })] },
  'extensor-carpi-ulnaris-tendon': { carve: [carve('Humeral_head_of_extensor_carpi_ulnaris', 'down', { fraction: 0.25 })] },
  'wrist-extensor-tendons': { carve: [carve('Extensor_carpi_radialis_longus', 'down', { fraction: 0.4 }), carve('Extensor_carpi_radialis_brevis', 'down', { fraction: 0.35 })] },
  'flexor-carpi-radialis-tendon': { carve: [carve('Flexor_carpi_radialis', 'down', { fraction: 0.4 })] },
  'flexor-carpi-ulnaris-tendon': { carve: [carve('Humeral_head_of_flexor_carpi_ulnaris', 'down', { fraction: 0.15 })] },
  'palmaris-longus-tendon': { carve: [carve('Palmaris_longus_muscle', 'down', { fraction: 0.55 })] },
  'flexor-digitorum-superficialis-tendons': { carve: [carve('Humero-ulnar_head_of_flexor_digitorum_superficialis', 'down', { fraction: 0.4 })] },
  'flexor-digitorum-profundus-tendons': { carve: [carve('Flexor_digitorum_profundus', 'down', { fraction: 0.42 })] },
  'flexor-pollicis-longus-tendon': { carve: [carve('Flexor_pollicis_longus', 'down', { fraction: 0.4 })] },
  'extensor-digitorum-tendons': { carve: [carve('Extensor_digitorum', 'down', { fraction: 0.45 })] },
  // ---- Head and neck ----
  'temporalis-tendon': { carve: [carve('Temporalis_muscle', 'down', { fraction: 0.2 })] },
  'digastric-intermediate-tendon': { atlas: ['Intermediate_tendon_of_digastric_muscle'] },
};
