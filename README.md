# Mika Physio — muscle knowledge base (PWA)

A reference app for physiotherapists and students. It installs on a phone, works offline, and covers each muscle's anatomy, origin and insertion, nerve and blood supply, actions with agonists and antagonists, clinical significance and assessment. Each muscle has 2–3 rendered views and an interactive 3D view.

There is no account and no server; all data ships with the app.

## Contents

- **Muscles tab**: 166 physiotherapy-relevant skeletal muscles in four regions, each grouped by compartment and layer:
  - **Head & neck** (39): sternocleidomastoid, platysma, scalenes, suprahyoid and infrahyoid groups, deep neck flexors, suboccipitals, splenius and semispinalis, mastication and key muscles of facial expression.
  - **Trunk & pelvis** (27): serratus posterior, erector spinae, transversospinalis, quadratus lumborum, diaphragm and intercostals, abdominal wall, pelvic floor and perineum.
  - **Upper limb** (50): pectoral and posterior axio-appendicular, scapulohumeral and rotator cuff, arm, forearm and hand compartments.
  - **Lower limb** (50): gluteal region and deep rotators, iliopsoas, thigh and leg compartments, dorsum and the four plantar layers of the foot.
- **Muscle page** with sub-tabs:
  - **Overview**: summary, 2–3 images (the most informative of anterior, posterior, lateral, medial and from below, chosen automatically), structure, function, sources.
  - **Origin & insertion**: precise landmarks with bone tags, an image with origin areas in red and insertion areas in blue, anatomical variations.
  - **Nerve & blood**: nerves with root values (cranial nerves for the head), a note where sources disagree, reflexes, arteries.
  - **Actions**: per joint and movement (prime mover or assisting), normal ROM, agonists and antagonists for each action.
  - **Clinical**: clinical significance, trigger points and referred pain.
  - **Assessment**: palpation, manual muscle test, linked special tests, stretching, strengthening.
  - **3D**: rotate, zoom, region-specific views (front, back, side, inner side, below), origin/insertion overlay, other muscles faded, tap a muscle to name it.
- **Search and reverse lookup**: by name, Latin name or synonym, and filters for nerve, spinal root, action and attaching bone ("which muscles abduct the hip", "what does the tibial nerve supply", "what attaches to the pisiform"). Filters are kept in the URL.
- **Bones & joints tab**: each bone's origins and insertions; each joint's movements with normal ROM (AAOS) and the muscles that produce them, including the pelvis, pelvic floor, TMJ, hyoid and facial expression.
- **Nerves tab**: course, muscles supplied directly and through branches (e.g. sciatic → tibial → plantar nerves), sensory area, lesions; key myotomes (screening movement and ASIA key muscle); muscles by root.
- **Special tests tab**: 56 muscle-related tests with procedure, positive finding, notes and related muscles.
- **Share**: sends a muscle card (text, link and the first image where supported) through the phone's share sheet, or copies it.
- **Rehab tab**: 250 therapeutic exercises in four regions (upper extremity & neck, lower extremity, spine & core, whole body & conditioning), grouped by muscle group. Each exercise has its type, level, equipment, target muscles (with their highlighted anatomy images), starting position, steps, cues, common mistakes, a typical starting dosage, easier and harder versions, precautions, a physio tip, the research behind it where there is some, and a YouTube search for a demonstration. Search and filters for muscle, type, equipment and level. Each muscle page has an **Exercises** sub-tab, and each nerve page lists its nerve mobility exercises.
- **Fractures and Surgeries** (Rehab sub-tabs): rehabilitation protocols grouped by region and area, with operative and non-operative pathways where both are common. Each protocol has key points, chronological phases (timeframe, goals, weight bearing/brace/range limits, precautions, mapped exercises with phase-specific notes, criteria to progress), return-to-activity criteria, outcome measures, a "where protocols differ" section and its sources. Every protocol carries the reminder to follow the operating surgeon's protocol. Lower extremity: 11 fracture protocols (hip, femoral shaft, patella ×2, tibial plateau, tibial shaft, ankle ×2, calcaneus, fifth metatarsal ×2) and 12 surgery protocols (total hip replacement ×2, hip arthroscopy, total knee replacement, ACL reconstruction, partial meniscectomy, meniscal repair, MPFL reconstruction, Achilles rupture operative and non-operative, Broström, bunion correction).

## How the data stays consistent

- Agonists and antagonists are **derived**, not typed in by hand. The agonists of an action are all other muscles with the same joint movement; the antagonists are the muscles that perform the opposite movement (`src/domain/relations.ts`). The same applies to "muscles supplied by a nerve", "attachments on a bone" and "movers of a joint".
- `src/data/protocols/protocols.test.ts` checks every protocol: known areas, exercises and sources, each phase filled in, and progression criteria on every phase except the last.
- `src/data/exercises/exercises.test.ts` checks every exercise: known muscles, nerves, groups, sources, and that easier/harder links point to real exercises.
- `src/data/data.test.ts` checks every record: ids, known bones, nerves, joints, movements, tests and sources, that every section is filled in, and that joint movements have symmetric opposites.

## Data sources and method

Each record is written in original wording from standard anatomical knowledge, then cross-checked against TeachMeAnatomy, Kenhub, Wikipedia (Gray's Anatomy 1918), Radiopaedia, StatPearls and Physiopedia (through web search summaries; the build environment could not open those sites directly). Where sources disagree (most often root values), the most commonly cited value is shown with the alternatives in a note. ROM values are the AAOS norms. The full method is on the in-app About screen.

Exercise technique and dosage follow Physiopedia and the ACSM position stand on resistance training; specific claims cite the study (for example Reinold 2004, Distefano 2009, van Dyk 2019, Harøy 2019, Askling 2013, Alfredson 1998, Kongsgaard 2009, Tyler 2010, Dumoulin 2018, NICE NG123, FIFA 11+). Protocols are built from clinical practice guidelines, consensus statements, randomised trials and published hospital protocols (for example Aspetar 2023 and MOON 2015 for ACL reconstruction, the EU-US meniscus consensus 2024, the APTA total knee arthroplasty guideline 2020 and its 2026 revision, the JOSPT hip fracture guideline 2021, NICE CG124, and the WAX, UKSTAR, HeFT and Kortekangas trials), again checked through web search summaries. Where institutions disagree, the protocol gives the common range and says so. Each was checked through web search summaries. The tips are original, written in the style of short physio tip posts; none are copied from social media.

Complete Anatomy (3D4Medical/Elsevier) and anatomy.app were used only as models of what to show and how. None of their content, images or models is copied: they are proprietary.

## 3D model and images

- Source: [Z-Anatomy](https://github.com/LluisV/Z-Anatomy) (CC BY-SA 4.0), derived from [BodyParts3D](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/) © The Database Center for Life Science (CC BY-SA 2.1 JP). Under share-alike, the images in `public/images/` and the model in `public/models/` are CC BY-SA 4.0.
- Eight small muscles are not modelled in any open atlas (palmaris brevis, puborectalis, the external urethral sphincter, bulbospongiosus, ischiocavernosus, the transverse perinei and semispinalis capitis); they have full data but no image.
- Z-Anatomy includes origin/insertion areas as meshes, but its origin/insertion labels are not consistent (e.g. serratus anterior is reversed) and some left/right labels are swapped. The build therefore takes the side from the geometry and classifies each area by the bone it lies on, using the app's own origin/insertion data. The classification report is written to `scripts/anatomy/.cache/attachments-report.txt`.

Rebuild (only needed when the model mapping or the muscle list changes):

```bash
node scripts/anatomy/build-model.mjs                # downloads the pinned Z-Anatomy FBX files, writes public/models/<region>.{json,bin}
node scripts/anatomy/render-images.mjs             # renders public/images/muscles/*.webp and src/data/generated/muscleImages.json
node scripts/anatomy/render-images.mjs lower-limb  # re-render one region only
```

`scripts/anatomy/config.mjs` defines one model per region (which part of the skeleton it shows) and `scripts/anatomy/meshes/<region>.mjs` maps each app muscle to its Z-Anatomy meshes. The renderer uses the same scene code as the in-app viewer (`src/viewer/scene.ts`) through the build-only page `scripts/anatomy/render.html`. Rendering uses Playwright's Chromium.

## Development

```bash
npm install
npm run dev        # http://localhost:5173/MikaPhysiotherapy/
npm test           # data integrity and lookup tests (Vitest)
npm run typecheck
npm run build      # production build in dist/
npm run preview
```

Stack: React 19, TypeScript, Vite, vite-plugin-pwa (Workbox), three.js (lazily loaded for the 3D tab).

Offline: the app shell, all text and the list thumbnails (~3 MB) are installed on the first visit. Full-size images and the four regional 3D models (~30 MB together) are cached the first time they are opened, or all at once from **About → Save all images and 3D models**.

## Deploying to GitHub Pages

`.github/workflows/deploy.yml` tests, builds and deploys on every push to `main`. One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**. The app is then served at `https://<user>.github.io/MikaPhysiotherapy/`. If the repository is renamed, update `BASE_PATH` in `vite.config.ts`.

## Installing on a phone

- **iPhone (Safari)**: open the site, **Share → Add to Home Screen**.
- **Android (Chrome)**: **Install app** from the prompt or the ⋮ menu.

## Disclaimer

For education and quick reference. Not a substitute for clinical assessment and judgement.
