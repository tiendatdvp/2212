# SecureGate Specification

## Overview

- **Target file:** `src/components/SecureGate.tsx`
- **Screenshot:** Browser screenshot capture unavailable in this environment; extraction used live HTML/CSS and downloaded target assets.
- **Interaction model:** static + time-driven CSS animations + input focus + click submit state

## DOM Structure

- `main.gate`
  - background layers: `.gate__grid`, `.gate__radar`, `.gate__ring--lg`, `.gate__ring--sm`, `.gate__falloff`
  - `.gate__topbar`
  - `section.gate__stage`
    - `.gate__card`
      - four `.sa-corner` spans
      - `.gate__scanbar`
      - `.gate__band`
      - `.gate__body`
        - `.gate__brand` with logo, h1, subtitle
        - `.gate__divider`
        - `.gate__boot`
        - `.gate__form`
        - `.gate__help`
  - `.gate__warn`
  - optional `.auth`
  - fixed `.sa-scanlines` and `.sa-vignette`

## Computed Styles

### Gate Container

- min-height: `100vh`
- display: `flex`
- flex-direction: `column`
- position: `relative`
- overflow: `hidden`
- background: radial gradient from panel/radar mix at `70% 20%` into `#090c0b`

### Topbar

- font-family: `JetBrains Mono`
- font-size: `10px`
- letter-spacing: `0.22em`
- color: `#747c75`
- padding: `14px 24px`
- display: `flex`
- justify-content: `space-between`
- right group gap: `18px`
- node label color: `#aeb4ad`

### Card

- width: `min(430px, 94vw)`
- background: `color-mix(in srgb, #151917 86%, transparent)`
- border: `1px solid rgba(174, 180, 173, 0.28)`
- backdrop-filter: `blur(10px)`
- box-shadow: `0 30px 80px rgba(0,0,0,.6)`, inset radar glow

### Brand

- logo: `104px` wide, drop shadow `0 6px 18px rgba(0,0,0,.6)`
- title: Oswald, `23px`, `600`, letter-spacing `0.34em`
- subtitle: JetBrains Mono, `9.5px`, letter-spacing `0.26em`, color `#949c94`

### Boot Log

- font-family: `JetBrains Mono`
- font-size: `10.5px`
- line-height: `1.9`
- min-height: `84px`
- waiting row color: `#aeb4ad`
- caret: `8px x 13px`, background `#aeb4ad`, blink animation

### Form

- display: `flex`
- flex-direction: `column`
- gap: `14px`
- label text: JetBrains Mono, `9.5px`, letter-spacing `0.24em`, color `#949c94`
- inputs: background `#0c100e`, border `rgba(174,180,173,.28)`, padding `12px 14px`, font `13.5px`
- password input letter-spacing: `0.3em`
- submit: background `#aeb4ad`, color `#101412`, Oswald, `14.5px`, `600`, letter-spacing `0.3em`, padding `14px 10px`

## States & Behaviors

### Time-driven Background

- Radar: conic gradient rotating 360deg over `10s linear infinite`.
- Card scanbar: vertical movement from `top:-4%` to `top:104%` over `4.5s ease-in-out infinite`.
- Scanlines: fixed overlay flicker every `4s`.
- Caret: blink with `1.1s step-end infinite`.

### Input Focus

- Trigger: focus on either input.
- State A: border `rgba(174,180,173,.28)`, no focus ring.
- State B: border `#aeb4ad`, box-shadow `0 0 0 3px color-mix(in srgb, #aeb4ad 15%, transparent)`.
- Transition: `border-color .2s, box-shadow .2s`.

### Submit Button

- Hover: `filter: brightness(1.12)`.
- Active: `transform: translateY(1px)`.
- Pending: disabled opacity `.6`, cursor `wait`.
- Wrong credentials: enters pending state for 650ms, then shows `.gate__error`; input changes clear the error.
- Correct credentials: shows transient `.auth` transfer screen for about 1.75s, then mounts the archive instead of calling the original backend.

## Text Content

- 2212.VN // SECURE GATEWAY
- SEVER: HN-01
- TỐI MẬT
- 2212 VIET NAM
- KHO LƯU TRỮ TỐI MẬT — TRUY CẬP HẠN CHẾ
- > KHỞI TẠO GIAO THỨC BẢO MẬT 2212
- > KẾT NỐI MÁY CHỦ HN-01 · AES-256
- > ĐỒNG BỘ CHỈ MỤC KHO LƯU TRỮ
- > CHỜ XÁC THỰC DANH TÍNH
- MÃ ĐỊNH DANH / OPERATIVE ID
- MẬT MÃ TRUY CẬP / ACCESS CODE
- XÁC THỰC DANH TÍNH ▸
- CHƯA CÓ MÃ TRUY CẬP?
- LIÊN HỆ BAN ĐIỀU HÀNH 2212 VIET NAM
- ĐỂ ĐƯỢC CẤP QUYỀN ĐỘC GIẢ
- CẢNH BÁO: HỆ THỐNG DÀNH RIÊNG CHO NHÂN SỰ ĐƯỢC CẤP QUYỀN.
- MỌI PHIÊN TRUY CẬP ĐỀU ĐƯỢC GIÁM SÁT VÀ GHI LẠI — ĐIỀU 2212VN/QĐ-BM.

## Responsive Behavior

- **Desktop (1440px):** card centered at `430px`, topbar two-column alignment.
- **Tablet (768px):** same layout, card remains `min(430px,94vw)`.
- **Mobile (390px):** stage padding `18px 12px`, body padding `24px 20px 26px`, logo `92px`, title `19px`, form text reduced.
