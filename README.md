# Mika Physio — muscle knowledge base (PWA)

A reference app for physiotherapists and students. It installs on a phone, works offline, and covers each muscle's anatomy, origin and insertion, nerve and blood supply, actions with agonists and antagonists, clinical significance and assessment. Each muscle has 2–3 rendered views and an interactive 3D view.

There is no account and no server; all data ships with the app.

## Phase 1 (this version)

- **Muscles tab**: the 50 physiotherapy-relevant muscles of the **upper limb**, grouped by region → compartment → layer. Head & neck, trunk & pelvis and lower limb are shown as "coming soon".
- **Muscle page** with sub-tabs:
  - **Overview**: summary, 2–3 images (anterior/posterior/lateral, the most informative chosen automatically), structure, function, sources.
  - **Origin & insertion**: precise landmarks with bone tags, an image with origin areas in red and insertion areas in blue, anatomical variations.
  - **Nerve & blood**: nerves with root values, a note where sources disagree, reflex, arteries.
  - **Actions**: per joint and movement (prime mover or assisting), normal ROM, agonists and antagonists for each action.
  - **Clinical**: clinical significance, trigger points and referred pain.
  - **Assessment**: palpation, manual muscle test, linked special tests, stretching, strengthening.
  - **3D**: rotate, zoom, front/back/side, origin/insertion overlay, other muscles faded, tap a muscle to name it.
- **Search and reverse lookup**: by name, Latin name or synonym, and filters for nerve, spinal root, action and attaching bone ("which muscles abduct the shoulder", "what does the axillary nerve supply", "what attaches to the pisiform"). Filters are kept in the URL.
- **Bones & joints tab**: each bone's origins and insertions; each joint's movements with normal ROM (AAOS) and the muscles that produce them.
- **Nerves tab**: course, muscles supplied (directly and through branches), sensory area, lesions; key myotomes; muscles by root.
- **Special tests tab**: 28 muscle-related upper-limb tests with procedure, positive finding, notes and related muscles.
- **Share**: sends a muscle card (text, link and the first image where supported) through the phone's share sheet, or copies it.

## How the data stays consistent

- Agonists and antagonists are **derived**, not typed in by hand. The agonists of an action are all other muscles with the same joint movement; the antagonists are the muscles that perform the opposite movement (`src/domain/relations.ts`). The same applies to "muscles supplied by a nerve", "attachments on a bone" and "movers of a joint".
- `src/data/data.test.ts` checks every record: ids, known bones, nerves, joints, movements, tests and sources, that every section is filled in, and that joint movements have symmetric opposites.

## Data sources and method

Each record is written in original wording from standard anatomical knowledge, then cross-checked against TeachMeAnatomy, Kenhub, Wikipedia (Gray's Anatomy 1918), Radiopaedia and Physiopedia. Where sources disagree (most often root values), the most commonly cited value is shown with the alternatives in a note. ROM values are the AAOS norms. The full method is on the in-app About screen.

Complete Anatomy (3D4Medical/Elsevier) and anatomy.app were used only as models of what to show and how. None of their content, images or models is copied: they are proprietary.

## 3D model and images

- Source: [Z-Anatomy](https://github.com/LluisV/Z-Anatomy) (CC BY-SA 4.0), derived from [BodyParts3D](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/) © The Database Center for Life Science (CC BY-SA 2.1 JP). Under share-alike, the images in `public/images/` and the model in `public/models/` are CC BY-SA 4.0.
- Palmaris brevis is not modelled in any open atlas, so it has no image.
- Z-Anatomy includes origin/insertion areas as meshes, but its origin/insertion labels are not consistent (e.g. serratus anterior is reversed) and some left/right labels are swapped. The build therefore takes the side from the geometry and classifies each area by the bone it lies on, using the app's own origin/insertion data. The classification report is written to `scripts/anatomy/.cache/attachments-report.txt`.

Rebuild (only needed when the model mapping or the muscle list changes):

```bash
node scripts/anatomy/build-model.mjs    # downloads the pinned Z-Anatomy FBX files, writes public/models/upper-limb.{json,bin}
node scripts/anatomy/render-images.mjs  # renders public/images/muscles/*.webp and src/data/generated/muscleImages.json
```

`scripts/anatomy/config.mjs` maps each app muscle to its Z-Anatomy meshes. The renderer uses the same scene code as the in-app viewer (`src/viewer/scene.ts`) through the build-only page `scripts/anatomy/render.html`. Rendering uses Playwright's Chromium.

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

Offline: the app shell and all still images (~8 MB) are precached on install. The 3D model (~3 MB) is downloaded the first time a 3D tab is opened, then cached.

## Deploying to GitHub Pages

`.github/workflows/deploy.yml` tests, builds and deploys on every push to `main`. One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**. The app is then served at `https://<user>.github.io/MikaPhysiotherapy/`. If the repository is renamed, update `BASE_PATH` in `vite.config.ts`.

## Installing on a phone

- **iPhone (Safari)**: open the site, **Share → Add to Home Screen**.
- **Android (Chrome)**: **Install app** from the prompt or the ⋮ menu.

## Disclaimer

For education and quick reference. Not a substitute for clinical assessment and judgement.
