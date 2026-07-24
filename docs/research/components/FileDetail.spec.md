# FileDetail Specification

## Overview
- Target file: `src/components/ArchiveExperience.tsx`
- Interaction model: click-driven modal opened from a case-file card.
- Source references:
  - `docs/research/www.2212.vn/authenticated/page.html`
  - `docs/research/www.2212.vn/target-global.css`
  - `src/data/dossier-details.json`
  - `docs/research/www.2212.vn/detail/all-dossiers.json`
  - `https://www.2212.vn/ho-so/h-ky-1-h3-h67-bong-ma-thanh-sai-gon`

## DOM Structure
- `.file-detail` fixed dialog overlay.
- `.file-detail__backdrop` closes the modal.
- `.dossier-page.dossier-page--modal` mirrors the original detail route page.
- `.dossier-topbar` contains the original back link and `2212VN SECURE ARCHIVE // ĐÃ GIẢI MẬT` label.
- `.dossier` is the centered paper sheet, 820px max width.
- `.dossier__head`, `.dossier__stampline`, `.dossier__title`, `.dossier__series`, `.dossier__meta`, `.dossier__hero`, `.dossier__content`, `.dossier__foot` match the original DOM/classes from `detail.html`.

## Behavior
- Clicking a file card opens the dossier modal directly.
- The modal does not show the previous summary metadata/actions block.
- Back link and backdrop return to the archive list.
- Detail modal content is resolved by dossier `slug` from `src/data/dossier-details.json`.
- All 37 case-file detail pages have captured original paragraphs and local hero images under `public/images/2212/dossiers/`.

## Responsive
- Desktop: two-column hero and horizontal four-column metadata.
- Mobile: stacked hero, two-column metadata, single-column article body.
