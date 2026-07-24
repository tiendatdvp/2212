# 2212.vn Page Topology

## Sections

1. Fixed visual overlays
   - Grid, rotating radar cone, two centered rings, radial falloff, scanlines, vignette.
   - Interaction model: time-driven CSS animations.

2. Topbar
   - Left: `2212.VN // SECURE GATEWAY`.
   - Right: `SEVER: HN-01` and UTC+7 clock.
   - Interaction model: static plus live client-side clock.

3. Secure gate card
   - Classification band, logo, site title, subtitle, divider, boot log, two credential inputs, submit button, access help text.
   - Interaction model: form focus, submit click, time-driven scanbar/caret.

4. Warning footer
   - Two-line monitoring warning.
   - Interaction model: static.

5. Authentication overlay
   - Server-side original has additional auth-state CSS. Clone implements a local demo overlay after form submit.
   - Interaction model: click-driven transient state.

6. Authenticated archive
   - Header, hero, marquee, briefing, case files, documentary archive, civic ops, activities, products, commendations, allies, footer.
   - Interaction model: sticky/anchor navigation, click-driven case-file filters, hover cards, time-driven radar/marquee.

## Layout

- Root container `.gate`: `min-height:100vh`, flex column, relative, overflow hidden.
- `.gate__stage`: flex child that centers the card in remaining viewport space.
- Visual background elements are absolutely positioned under content at z-index default.
- Content layers use z-index 2. Scanline/vignette overlays use z-index 200.

## Assets

- Logo: `/images/2212/2212VN-LG-3-removebg-preview.png`
- Favicon/SEO logo: `/seo/logo.png`
- OG image: `/seo/2212-archive-og.webp`
- Fonts: 26 target woff2 files in `/fonts/2212/`
