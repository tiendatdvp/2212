# ArchiveExperience Specification

## Overview

- **Target file:** `src/components/ArchiveExperience.tsx`
- **Screenshots:** `docs/design-references/www.2212.vn/authenticated-desktop.png`, `docs/design-references/www.2212.vn/authenticated-mobile.png`
- **Interaction model:** sticky header, anchor navigation, click-driven case-file filtering, hover-driven card elevation, time-driven hero radar/marquee.

## DOM Structure

- `.archive`
  - `.arc-header` sticky navigation
  - `.hero` archive intro with radar grid, pings, CTA, quote card
  - `.marquee`
  - `#briefing` about section with values and desk image
  - `#files` filter chips and 37 `.file` cards
  - `#docs` 5 documentary cards plus pending cell
  - `#civic` 6 civic operation cards
  - `#activities` 2 activity cards
  - `#products` 6 product cards
  - `#commendations` 6 recognition figures
  - `#allies` 2 alliance cards
  - `.arc-footer`

## Extracted Counts

- Header links: 8 visible navigation/actions.
- Case files: 37.
- Documentary cards: 5.
- Civic cards: 6.
- Activities: 2.
- Products: 6.
- Commendations: 6.
- Allies: 2.
- Authenticated images discovered: 67; downloaded archive assets: 66 unique images plus shared logo/SEO assets.

## Key Styles

- Header: sticky top, `backdrop-filter: blur(12px)`, background `color-mix(in srgb, #0c100e 92%, transparent)`, border bottom `rgba(174,180,173,.16)`.
- Hero: radial archive background, grid overlay at 68px intervals, rotating conic sweep.
- Section inner spacing: `92px 24px` desktop, `64px 20px` mobile.
- File grid: `repeat(auto-fill,minmax(310px,1fr))`, 24px gap.
- File card: panel background `#151917`, border gold 18%, hover translateY(-4px), image height 172px, scrim overlay, red declassified stamp.
- Generic grids: `repeat(auto-fit,minmax(280px,1fr))`, 22px gap.

## States & Behaviors

- Case file chips update the visible file set client-side. `aria-pressed=true` changes background to `#aeb4ad`, text to `#101412`.
- Case file cards open an in-page detail-page modal in the clone. The modal goes directly to the article-style detail view with a header, status strip, large local image, and extracted body text; the old summary metadata/action block is hidden.
- Cards hover by lifting 4px and increasing gold border/shadow.
- Marquee pauses on hover.
- Header links are anchor links to sections.
- Login gate transitions to archive only when `ID-GUEST` / `p2212vn!` are submitted in the local clone.

## Responsive Behavior

- Desktop 1440px: 3-column case-file grid, 2-column hero, sticky nav with inline actions.
- Mobile 390px: nav scrolls horizontally, hero stacks, all grids collapse to one column, file metadata wraps.
