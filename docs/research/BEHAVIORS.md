# 2212.vn Behavior Sweep

Target: https://www.2212.vn/
Date inspected: 2026-07-24

## Summary

Single secure-gateway screen. No scroll-driven section changes were present on the public entry page. The page is centered in a full-viewport dark archive console with animated background effects and a small interactive login form.

## Scroll Sweep

- Page height: full viewport gateway layout with warning text anchored after the centered card.
- Header: static topbar; no scroll-triggered change.
- Section animations: radar sweep, scanline flicker, card scanbar, boot caret blink are time-driven CSS animations.
- Scroll snap / smooth scroll: none found on the public gate.

## Click Sweep

- Operative ID input: focus changes border from `rgba(174, 180, 173, 0.28)` to `#aeb4ad` and adds a 3px gold-tinted focus ring.
- Access code input: same focus behavior, with wider letter spacing.
- Submit button: hover brightens the gold fill; active press moves the button down 1px.
- Original form submits to server action. Clone prevents navigation and shows a short authentication overlay that mirrors the target CSS names and granted stamp styling.

## Hover Sweep

- Submit button: `filter: brightness(1.12)`, transition `filter .15s, transform .1s`.
- Inputs: no hover-specific style found; focus is the meaningful input state.

## Responsive Sweep

- Desktop 1440px: centered `430px` card, topbar split left/right, warning below stage.
- Tablet 768px: same single-card layout, constrained by `width:min(430px,94vw)`.
- Mobile 390px: card remains centered, body padding tightens, type sizes reduce, topbar wraps.

## Global Effects

- `gate__radar`: conic gradient rotates every 10s.
- `gate__scanbar`: horizontal scan line sweeps down the card every 4.5s.
- `sa-scanlines`: fixed overlay with repeating horizontal lines and flicker.
- `sa-vignette`: fixed radial edge darkening.
- `gate__caret`: blinking block cursor after the waiting boot line.

## Authenticated Archive Sweep

- Login with `ID-GUEST` / `p2212vn!` reveals the archive on the same URL.
- Header is sticky with blurred dark background; nav anchors jump to sections.
- Case-file filter chips are click-driven. `TẤT CẢ` shows 37 files; individual series filter to B, C32, H, J, K7, M, R, S.
- File/doc/product cards have hover lift and gold border emphasis.
- Hero radar and marquee are time-driven CSS animations.
- Mobile collapses all card grids to one column and uses horizontal nav overflow.
