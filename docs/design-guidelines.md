# InterAACtion Web — Design Guidelines

This is the source of truth for the visual language of the suite. Every
new surface added to this repo (a portal section, a calibration step, a
GazePlay game, a future companion screen) follows the rules below. The
upstream apps (AugCom, Player, Scene) keep their internal Angular UIs,
but they receive `app-skin.css` and the gaze-bridge bar at runtime so
the chrome around them is always consistent with the rest of the suite.

## 1. Palette

Defined once in `portal/assets/tokens.css`. Never inline a colour
literal except in the icon sprite where colours are intrinsic to the
icon design.

| Role            | Light          | Dark           | When to use                              |
| --------------- | -------------- | -------------- | ---------------------------------------- |
| `--accent`      | `#1856a7`      | `#74a9ec`      | Primary CTA, links, focus accent         |
| `--magenta`     | `#c44db5`      | `#e67fd8`      | Secondary accent, GazePlay tile          |
| `--peach`       | `#ff8a5b`      | `#ffb085`      | Player tile, calibration target inner    |
| `--mint`        | `#45c29a`      | `#76dfba`      | Scene tile, success states               |
| `--warning`     | `#ffbf47`      | `#ffd66b`      | Focus ring, recalibration hint           |
| `--fg-strong`   | `#050814`      | `#ffffff`      | Headings                                 |
| `--fg`          | `#0e1220`      | `#e8ecf6`      | Body text                                |
| `--muted`       | `#51576a`      | `#a7afc2`      | Secondary text                           |
| `--bg`          | `#ffffff`      | `#0b0d15`      | Page background                          |
| `--bg-alt`      | `#f5f7fc`      | `#121524`      | Alternate sections, cards                |
| `--bg-chrome`   | `rgba(11,…)`   | same           | Floating bar / overlay                   |

## 2. Typography

- **Family:** `Inter` first, then `system-ui` fallback. Defined as
  `--font` in `tokens.css`. No web-font download on first paint —
  Inter is used if it's already on the system, otherwise system fonts
  take over.
- **Headings:** weight 700 or 800, `letter-spacing: -0.02em`. Hierarchy
  matters: one `<h1>` per page, `<h2>` for sections, `<h3>` for cards.
- **Body:** weight 500 by default, `line-height: 1.6`. Max width
  `65ch` for paragraphs to keep reading comfortable.

## 3. Radius and elevation

Three radii, three shadows, no exception.

```
--radius-sm   8px    Pills, buttons, badges
--radius     12px    Inputs, smaller cards, banner edges
--radius-lg  20px    App cards, large surfaces
--radius-pill 999px  Floating bar buttons, status chips
```

```
--shadow-sm   1px 2px        Resting cards, brand mark
--shadow      10px 30px      Lifted cards, primary CTAs
--shadow-lg   28px 60px      Hero CTA on hover, modals
```

## 4. Iconography

A single sprite at `portal/assets/icons.svg`, addressed via
`<svg><use href="/assets/icons.svg#icon-name"/></svg>` from anywhere.

- **Action icons** (`icon-home`, `icon-target`, `icon-eye`,
  `icon-eye-off`, `icon-arrow-left`, `icon-calibrate`,
  `icon-external`, `icon-settings`) are stroke-based at width 1.75
  with round caps, picking up the host text colour through
  `currentColor`. They live inside text labels and inherit the
  surrounding palette.
- **App icons** (`icon-app-augcom`, `icon-app-scene`,
  `icon-app-player`, `icon-app-gazeplay`) are filled tiles with their
  own colour identity (blue / mint / peach / magenta). They are
  self-sufficient — drop them into a 64×64 slot, no wrapper
  background, no border.
- **Brand** (`icon-logo`) is the same gradient-coloured rounded
  square used in the sticky header and in the gaze-bridge bar.
- New icons follow the same rules; document them at the top of the
  sprite file.

## 5. Components

### Buttons

```
class                what it is              CSS
.cta-primary         hero solid CTA          accent fill, white text, lift on hover
.cta                 section CTA             accent fill, white text
.cta-secondary       outline CTA             transparent fill, accent border
.cta-ghost           dashed ghost            transparent fill, dashed muted border
.card-cta            card-level link         compact CTA on app cards
```

### App cards

`<li>` inside `<ul class="apps">`. Always:
1. `.app-icon` slot 64×64 holding a sprite SVG.
2. `<h3>` title.
3. `<p class="muted">` ≤ 2 sentences.
4. Either `.card-cta` (open) or `.card-status` (placeholder).

### App bar (gaze-bridge)

The floating top-centre bar is the single point of cross-app
chrome. Its layout is fixed:

```
[logo] InterAACtion · <App name>    ⊕ Calibrer    👁 Regard ON    ⌂ Portail
```

Three actions, in this order, every time. Background is
`--bg-chrome` with backdrop-filter blur. Don't add icons or
buttons to it from inside an app — let the bridge own it.

## 6. Motion

- Default transition: `150 ms ease`.
- Hover lifts: `translateY(-2 px)` + shadow ramp `--shadow-sm` →
  `--shadow`.
- Reveal-on-scroll uses a 500 ms fade + 16 px slide. **All motion is
  cancelled** when `prefers-reduced-motion: reduce`.

## 7. Accessibility

Non-negotiable:

- Skip link before the header (`.skip-link`).
- One `<h1>` per page, sections labelled with `aria-labelledby`.
- Focus rings: `outline: 3px solid var(--focus)` with `outline-offset:
  3px` — visible on every interactive element.
- Touch targets ≥ 44 × 44 pixels.
- `:hover` styles disabled under `(hover: none)` so they don't linger
  on tap.
- Image `alt`: descriptive when informative, `""` + `aria-hidden`
  when decorative.
- Status messages routed through `role="status"` and `aria-live`.

## 8. Surfaces we own end-to-end

| Surface                   | Owner            | Skin                     |
| ------------------------- | ---------------- | ------------------------ |
| Portal `/`                | Us, full control | Direct token use         |
| `/calibration/`           | Us, full control | Direct token use         |
| `/gazeplay/`              | Us, full control | Direct token use         |
| `/augcom/`, `/scene/`,    | Upstream Angular | `app-skin.css` overlay + |
| `/player/`                |                  | gaze-bridge bar          |

The upstream apps keep their layouts. We only:
- inject the gaze-bridge bar at the top,
- inject `app-skin.css` to align font, button radius and primary
  colour where Angular Material exposes CSS variables,
- never alter Angular templates.

If a deeper visual rework of an upstream app is needed, it belongs in
a fork of that upstream — not in this repo.
