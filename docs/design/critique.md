# Design critique — Mika Physio (before the redesign)

Screens reviewed at 390 × 844: Muscles list, muscle detail, Special tests, Rehab, protocol, session editor, calendar week, progress, patient folder.

## Overall impression

Clean, readable and consistent, but it opens on a long text list and every screen gives every element the same weight. The app feels like a reference book rather than a tool Mika reaches for between sessions. The biggest opportunity is a visual front door — the body — plus a "today" view for her sessions.

## Usability

| Finding | Severity | Recommendation |
|---|---|---|
| The app opens on a 166-row muscle list grouped in collapsed cards; there is no overview and no visual way in | 🔴 Critical | A home screen with the interactive body (tap a muscle or bone → its data) and today's sessions |
| Six bottom tabs, two with two-line labels ("Bones & joints", "Special tests"); four of them are reference lookups of the same kind | 🟡 Moderate | Group the reference tabs into one **Library** (Muscles · Bones & joints · Nerves · Tests) and give Calendar its own tab: Home · Library · Rehab · Patients · Calendar |
| The calendar is buried as a sub-tab of Patients, although planning the day is a daily task | 🟡 Moderate | Calendar becomes a bottom-nav tab; Home shows today's sessions |
| The session editor is one long scroll of collapsed sections with no orientation | 🟡 Moderate | A sticky S · O · T · A · P jump bar and a summary header |
| Search lives separately in each tab | 🟡 Moderate | One search on Home across muscles, bones, nerves, tests, exercises and protocols |
| Empty states are a single grey line | 🟢 Minor | Friendly empty states with the next action |

## Visual hierarchy

- **What draws the eye first**: the page title, then a column of identical white cards — no focal point.
- **Reading flow**: top-to-bottom scanning of text; nothing visual until a muscle page.
- **Emphasis**: red is used for the brand, for active tabs, for links, for "Delete" and for the highlighted muscle in every image, so it means everything and nothing — and in a clinical app red reads as warning.

## Consistency

| Element | Issue | Recommendation |
|---|---|---|
| Colour | Red for brand, selection, links, destructive actions and anatomy | A calm teal primary; keep red only for the muscle highlight and destructive or error states |
| Cards | All cards share one weight; group headers look like list rows | Elevation levels: page background, grouped list surfaces, raised hero cards |
| Icons | Emoji (📈, 🔒, ＋) mixed with line icons | One line-icon set |
| Lists | Text-only rows in some lists, thumbnail rows in others | Leading visuals everywhere: thumbnails, date badges, region icons |

## Accessibility

- **Colour contrast**: body text and muted text pass AA on the warm background (muted #5f6672 ≈ 5.4:1); accent red on white ≈ 5.9:1. Dashed calendar lines are decorative.
- **Touch targets**: most controls are 44 px; tabs are 40 px, small remove buttons 32 px and set inputs 38 px — above the WCAG 2.2 minimum of 24 px but below the 44 px platform guideline.
- **Text readability**: 16 px base with 1.45 line height is good; meta lines at 13 px are fine.

## What works well

- The rendered anatomy images are a strong, distinctive asset.
- Consistent header pattern (back, title and subtitle, action), and filters kept in the URL.
- Dark mode and phone-first layout throughout.

## Priority recommendations

1. **Interactive body home page** — the front door: front and back, muscles or skeleton; tap to highlight and open a quick card, then the full page.
2. **Simpler navigation** — Home · Library · Rehab · Patients · Calendar, with one global search.
3. **Calmer visual system** — teal primary, elevation levels, one icon set, red only for anatomy and danger.
4. **Session editor orientation** — a sticky SOAP jump bar and summary.
