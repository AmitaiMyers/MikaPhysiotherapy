# Mika Physio design system

**Version 2 (current).** The source of truth is `src/styles/tokens.json`, also published as the private design-system reference (brand book, interaction and feedback spec, journeys, architecture and 14 component specs). `npm run tokens` writes `src/styles/tokens.css` from it.

## What v2 changed

| Area | v1 | v2 |
|---|---|---|
| Type | system font, 25 font sizes | Atkinson Hyperlegible Next and Mono (self-hosted, offline), 10 named styles |
| Spacing and radius | ad-hoc px values, 11 radii | 4px scale (`space-1…space-12`), `radius-sm/md/lg/pill`; enforced by tests |
| Colour | 15 tokens | 34 tokens incl. status pairs (success, attention, danger, info), input outlines at 3:1, on-stage colours; all text ≥ 4.5:1 in both themes |
| States | almost none | press, hover (pointer only), focus ring, disabled, busy, success for every control (`states.css`) |
| Feedback | native confirm/prompt, silent saves | sheets, toasts with Undo, save status with retry, skeletons, empty states, offline bar, Android haptics |
| Navigation | 5 Rehab tabs | Exercises · Techniques · Protocols · Programmes; sticky tabs with an overflow fade; jump bars on long pages |
| Accessibility | manual | radio-group segmented controls, focus moved to the page title, sheets that trap focus, axe scan of 34 screens × 2 themes |

The v1 audit and tokens below are kept for history.

---


## Audit (before this phase)

**Scope:** `src/styles.css` and the React components. **Score:** 62/100.

| Category | Defined | Hardcoded / inconsistent |
|---|---|---|
| Colours | 12 tokens + dark mode | 13 × `#fff` for text on accent; red accent doubles as brand, selection, links, danger and anatomy |
| Typography | system font, 16 px base | 19 different font sizes, no scale |
| Radius | `--radius` 14 px | 7 other values (8, 9, 10, 12, 3, 50 %, pill) |
| Elevation | none | cards separated by 1 px borders only |
| Icons | a few inline SVGs in the bottom nav | ~95 emoji / text glyphs (＋ ✎ ⤴ 🔒 📈 ⓘ ‹ › ×) |
| Touch targets | `--tap` 44 px | tabs 40 px, small icon buttons 32 px |

**Priority actions:** 1) teal primary and a separate danger colour, 2) elevation and radius scale, 3) one icon component, 4) type scale for new work.

## Tokens

### Colour

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#f5f4f0` | `#0d1114` | Page background |
| `--surface` | `#ffffff` | `#161c20` | Cards, lists, inputs |
| `--surface-2` | `#eef0ed` | `#1f272c` | Inset areas, badges |
| `--border` | `#dfe2dd` | `#2a343a` | Hairlines |
| `--text` | `#17201f` | `#ecf1f0` | Body text |
| `--muted` | `#5b6866` | `#9aa9a6` | Secondary text (≥ 4.5:1 on bg) |
| `--accent` | `#0e6f69` | `#4cc3b6` | Primary actions, selection, links |
| `--accent-strong` | `#0a5450` | `#7fd8cc` | Pressed / emphasis |
| `--accent-soft` | `#dcefec` | `#123230` | Selected backgrounds, tags |
| `--on-accent` | `#ffffff` | `#04201d` | Text on accent |
| `--danger` | `#b3322b` | `#f0857c` | Destructive actions, errors |
| `--danger-soft` | `#f8e1de` | `#3a1d1b` | Error backgrounds |
| `--anatomy` | `#c0463c` | `#d4594e` | Muscle red (images, tip box accent) |
| `--stage` | slate gradient | slate gradient | Behind anatomy renders |

Red is no longer a UI colour: it appears only in the anatomy and for danger.

### Shape, elevation and type

| Token | Value |
|---|---|
| `--radius-sm` / `--radius` / `--radius-lg` | 10 / 16 / 22 px |
| `--shadow-1` | resting cards: 1 px hairline + soft 1–3 px shadow |
| `--shadow-2` | floating sheets, the body card, the bottom nav |
| `--text-xs … --text-2xl` | 0.75, 0.85, 1, 1.15, 1.45, 1.85 rem |
| `--tap` | 44 px minimum touch target |

## Components

### Icon
`<Icon name="plus" />` — one 24 × 24, 1.8 px stroke line set (plus, edit, share, lock, chart, info, search, calendar, back, close, chevron, body, book, dumbbell, user, layers, rotate, zoom). Decorative by default (`aria-hidden`); icon-only buttons carry an `aria-label`.

### Buttons
| Variant | Use when |
|---|---|
| `button button-primary` | The one main action of a screen (filled teal) |
| `button` | Secondary actions (surface, hairline) |
| `text-button` | Inline / tertiary actions |
| `text-button danger` | Destructive actions (delete, erase) |
| `icon-button` | Header actions, 44 px round |

## New patterns

### Body explorer (home hero)
**Problem:** the app had no visual way in; Mika thinks in body regions, not in lists.

| Property | Type | Description |
|---|---|---|
| view | `front` \| `back` | Camera side (Rotate button flips it) |
| layer | `superficial` \| `deep` \| `skeleton` | Muscles, deeper muscles (superficial ones peeled away automatically), or bones only |
| selection | muscle or bone id | Highlighted in teal with a quick card |

**Behaviour:** tap a structure → it lights up and a quick card shows its name, key facts and "Open"; tap empty space → clear. Zoom (2×) scrolls natively for panning. The image and its ID map are pre-rendered at build time from the 3D model (`scripts/anatomy/render-body.mjs`), so it works offline and responds instantly.

**Accessibility:** the image has a text alternative; every structure is also reachable through search and the Library; the selection card is a live region; controls are 44 px segmented buttons.

### Home dashboard
Greeting and date, global search, the body explorer, **Today** (sessions from the calendar, or a prompt to unlock), and quick links into the Library, Rehab and Patients.

### Library hub
Muscles, Bones & joints, Nerves and Special tests as one tab with a sub-tab strip — the four reference sections behave the same way.

### SOAP jump bar
A sticky row of S · O · T · A · P chips at the top of the session editor that scrolls to each part.

## Navigation
Bottom nav: **Home · Library · Rehab · Patients · Calendar** (5 items, single-line labels).
