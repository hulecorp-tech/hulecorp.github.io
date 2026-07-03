# CLAUDE.md — hulecorp.github.io

## Project Overview

This repo has grown beyond a single portfolio page. It's a small hub for **Huy Le Creative**, a graphic designer based in Vietnam, hosted on GitHub Pages under the custom domain **huyle.io.vn** (via the `CNAME` file). It now contains:

- The main **portfolio** (`index.html`) — event branding, mascot design, banner & panel, packaging, brand identity, promotion
- A **community forum** (`forum.html`) with Supabase-backed auth, roles, and an admin panel
- A handful of **standalone Vietnamese-language utility tools**, each its own folder with a clean URL (`/qr`, `/barcode`, `/shopee`, `/design`, `/wheel`, `/paper`, `/midu_cbct`)
- A **Supabase Edge Function** (`supabase/functions/magnific`) that proxies a third-party AI image API
- A `/workout` tool for tracking daily company exercise attendance (localStorage only, no backend)

There is still no build step, no package.json, no CI/CD, and no shared framework — each page is a self-contained static HTML file.

## Repository Structure

```
hulecorp.github.io/
├── index.html              # Main portfolio (HTML+CSS+JS in one file)
├── v1.html                 # Archived pre-redesign portfolio snapshot (not linked, not live)
├── avatar.jpg               # Profile photo used in index.html
├── cert.html                # Meta-refresh + JS redirect shim → /midu_cbct
├── cert-template.png        # Canvas template image used by /midu_cbct
├── forum.html                # Community forum (Supabase auth, posts, admin panel)
├── CNAME                     # Custom domain: huyle.io.vn
├── qr/index.html             # QR code generator with logo
├── barcode/index.html        # EAN-13 barcode generator
├── shopee/index.html         # Shopee affiliate link converter/shortener
├── design/index.html         # AI Design Studio (Magnific/Freepik image generation)
├── wheel/index.html          # 3D lucky-wheel spinner game (+ .mp3 sound effects)
├── paper/index.html          # Printable paper/notebook template generator (jsPDF)
├── workout/index.html        # Daily exercise attendance tracker (localStorage only)
├── midu_cbct/index.html      # "Vinh danh Chiến binh Content" certificate generator
├── fonts/                    # Self-hosted OTFs used only by /midu_cbct
│   ├── MTD_Brand_Pro.otf
│   ├── RubikMKT-Bold.otf
│   └── RubikMKT-Regular.otf
└── supabase/functions/magnific/index.ts   # Deno edge function proxying the Magnific API
```

## Tech Stack

- **HTML5 / CSS3 / vanilla JS**, inline per page — no bundler, no transpiler, no linter
- Each tool page picks its own dependencies independently via CDN `<script>` tags — there is **no shared stack** across pages:
  - `index.html` (portfolio): Google Fonts — Urbanist + Space Mono + Noto Sans SC
  - `/paper`: Google Fonts — Rubik, plus jsPDF (`cdnjs.cloudflare.com`)
  - `/qr`: Tailwind CDN (`cdn.tailwindcss.com`) + `qr-code-styling` (`unpkg.com`)
  - `/barcode`: JsBarcode (`cdn.jsdelivr.net`)
  - `/midu_cbct`: self-hosted OTF fonts (`/fonts/*.otf`) drawn onto a `<canvas>`
- **Supabase** (hosted Postgres + Auth) is shared across `forum.html`, `/shopee`, `/midu_cbct`, `/design` via the JS client loaded from `cdn.jsdelivr.net`, project ref `dmvomgmhsivifionnkiu` (`https://dmvomgmhsivifionnkiu.supabase.co`). Client code uses the public anon key — safe to expose, do not confuse with a service-role key.
- **Deno Supabase Edge Function** (`supabase/functions/magnific/index.ts`) proxies the Magnific (Freepik) AI image API for `/design`, keeping `MAGNIFIC_API_KEY` server-side only.

## Custom Domain

The `CNAME` file (containing `huyle.io.vn`) makes GitHub Pages serve the site on the custom domain instead of the default `hulecorp.github.io`. **Never delete or rename this file** — doing so drops the custom domain.

## Architecture

### `index.html` — Portfolio (the main site)

Everything lives in this one file: `<head>` styles, body sections (`#home`/hero, `#about`, `#projects`, `#contact`), footer, and an inline `<script>` at the end of `<body>` for i18n, dark mode, filtering, and scroll animation.

This file went through an "editorial redesign" (inspired by David Heckhoff) — the naming/tokens below reflect the **current** state, not a simpler earlier version:

- Design tokens (`:root`):
  ```css
  --cream:#F5EFE6; --cream2:#EDE3D3; --cream3:#DFD1BC;
  --ink:#2D2A24; --ink2:#5F5646;
  --orange:#FF8400; --orange2:#FFA94D;
  --navy1:#002474; --navy2:#052E87; --navy3:#234BA2;
  --cyan:#34BFFF; --cyan-deep:#0086BB;
  ```
  Dark mode overrides `--cream`/`--ink`/`--card` under `[data-theme="dark"]`.
- Dark mode toggle: `#theme` button, **not persisted** (resets on reload, by design — do not add localStorage without considering UX intent).
- i18n: a single `T` object with `vi`/`en`/`zh` keys, elements marked `data-i18n="key"`, `applyLang(lang)` sets `textContent`. Language buttons: `.langs button[data-lang="vi|en|zh"]`.
- Project filter: buttons use `data-f="category|all"` (not `data-filter`), cards use `data-c="event|mascot|brand|pack|promo"` (not `data-category`). Card markup: `.card > .thumb + .card-body > .card-cat/.card-name/.card-desc/.view`. Filter grid container is `#grid`.
- Scroll-reveal: elements with class `.reveal` (not `.fade-up`) get `.in` added (not `.visible`) via `IntersectionObserver`.
- Responsive breakpoints: `@media (max-width: 920px)` and `@media (max-width: 680px)` (hamburger `.hamb` + `#mnav` mobile menu activates here).

### `forum.html` — Community forum

Supabase-backed (auth + Postgres). Roles: `user` / `moderator` / `admin`, gated with `prof?.role` checks. Hash-based routing (e.g. `#admin`). Admin panel has sub-tabs (`atab`): `users`, `perms`, `cats` (categories), `vouchers`. Hosts a `#tools` grid linking to every standalone tool page below. The `/midu_cbct` link is only shown to admin/moderator roles.

### Standalone tool pages

Each is a clean-URL folder (`/foo` → `foo/index.html`, no `.html` extension in links):

| Path | Purpose | Notes |
|---|---|---|
| `/qr` | QR code generator with logo | Tailwind + `qr-code-styling` |
| `/barcode` | EAN-13 barcode generator | JsBarcode |
| `/shopee` | Shopee affiliate link converter | Expands `s.shopee.vn` short links via `api.allorigins.win` proxy; Supabase-backed |
| `/design` | AI Design Studio | Generates images via Magnific/Freepik through the Supabase Edge Function (`FN_URL`); no API key in client code |
| `/wheel` | 3D lucky-wheel spinner game | Sound effects (`nhac-xo-so.mp3`, `wowcongratulation.mp3`), localStorage persistence for wheel config |
| `/paper` | Printable paper/notebook template generator | 40 templates, line styles, 4-side margins, watermark, page numbers; exports via jsPDF |
| `/workout` | Daily exercise attendance tracker | Fixed Mon–Sat calendar + 4 free slots, tick train (green) / rest (red), goal = 20 sessions/month, congrats banner at 100%; localStorage only, no Supabase |
| `/midu_cbct` | "Vinh danh Chiến binh Content" certificate generator | Draws text onto `cert-template.png` via `<canvas>`, using self-hosted `MTD Brand Pro` / `RubikMKT` fonts; Supabase-backed |

Each tool page is independent — don't assume the portfolio's i18n system, class naming, or CSS tokens apply inside these folders. Some use Tailwind, some hand-written CSS, some their own design tokens.

### `cert.html`

A meta-refresh + JS redirect shim (`location.replace('/midu_cbct'+location.hash)`), kept so old `/cert` links keep working.

### `v1.html`

Archived snapshot of the original pre-redesign portfolio (before commit `4a7a051`). Not linked from any nav, not served as the live homepage — kept purely for reference/rollback.

## Supabase Backend

- Shared project ref: `dmvomgmhsivifionnkiu` → `https://dmvomgmhsivifionnkiu.supabase.co`
- Client pages call `window.supabase.createClient(SB_URL, SB_KEY)` with the **public anon key** (safe to expose client-side).
- `supabase/functions/magnific/index.ts` — Deno edge function. Actions: `generate` (POST `/v1/ai/mystic`), `status` (GET), `upscale` (POST `/v1/ai/image-upscaler`), `upscale_status` (GET). Reads `MAGNIFIC_API_KEY` from an environment secret set via `supabase secrets set MAGNIFIC_API_KEY=xxxx`; deployed via `supabase functions deploy magnific`. This keeps the real API key off the client entirely.

## Adding Content to the Portfolio (`index.html`)

### New Project Card
Add inside the `#grid` container in the `#projects` section:
```html
<div class="card" data-c="event">
  <div class="thumb" style="background:linear-gradient(135deg,#FF8400,#FFA94D)">
    <span>🎪</span><span class="idx">10</span>
  </div>
  <div class="card-body">
    <div class="card-cat" data-i18n="ft.event">Event Branding</div>
    <div class="card-name" data-i18n="p10n">Project Name</div>
    <div class="card-desc" data-i18n="p10d">Description</div>
    <div class="view" data-i18n="v3.view">View</div>
  </div>
</div>
```
Then add matching `p10n`/`p10d` keys to all three language objects (`vi`, `en`, `zh`) in the `T` object.

### New Filter Category
1. Add a filter button: `<button data-f="newcat" data-i18n="ft.newcat">Label</button>` inside `.filters`
2. Add the translation key to all three language objects
3. Add `data-c="newcat"` to relevant cards

### New Page Section
1. Add `<section class="..." id="newid">` with `data-i18n` attributes on all text
2. Add a nav link (`.pill a` and the mobile `#mnav` equivalent) with matching `href="#newid"` and `data-i18n`
3. Add CSS following existing token/naming conventions (`--cream`/`--ink`/`--orange`/`--navy`/`--cyan`, BEM-ish component prefixes)
4. Add all translation keys to all three language objects
5. Add `.reveal` to elements that should scroll-animate, and make sure they're picked up by the `IntersectionObserver` (`document.querySelectorAll('.card,.reveal')`)

### New Standalone Tool
1. Create a new folder `toolname/index.html` (self-contained, own `<style>`/`<script>`, no shared dependency on `index.html`'s conventions)
2. Link it from `forum.html`'s `#tools` grid if it should be discoverable
3. If it needs a backend, reuse the shared Supabase project (`SB_URL`/`SB_KEY` pattern already used in `/shopee`, `/midu_cbct`, `/design`) rather than provisioning a new one
4. If it needs a secret API key, add a new Supabase Edge Function under `supabase/functions/` rather than embedding the key client-side

### New Image Asset
Commit the image file to the repo root (or the relevant tool folder). Reference it via relative path.

## Deployment

No build step. The workflow is:
```
Edit files → git commit → git push origin master
```
GitHub Pages serves the repo root directly at `huyle.io.vn` (via `CNAME`). Changes are live within ~60 seconds of push. No environment variables or secrets are required for the static frontend; the Supabase Edge Function's secret (`MAGNIFIC_API_KEY`) is managed separately via `supabase secrets set` / `supabase functions deploy`, not through GitHub Pages.

## Common Pitfalls

- **Always add translation keys to all three languages** (`vi`, `en`, `zh`) simultaneously in `index.html`. Missing keys cause the raw key string (e.g. `"nav.about"`) to render on screen.
- **Dark mode is not persisted** in `index.html` — it resets on page reload by design. Do not add localStorage without considering UX intent.
- **Images must be committed** — there is no CDN or asset pipeline. New images go in the repo root or relevant tool folder.
- **The `<script>` block must remain after all HTML content** in `index.html` — the JS queries DOM elements on load. Moving it to `<head>` without `defer` will break it.
- **Never delete the `CNAME` file** — it's what maps GitHub Pages to `huyle.io.vn`.
- **Never commit secret API keys** (e.g. `MAGNIFIC_API_KEY`, a Supabase service-role key) into any HTML/JS file. Only the Supabase public anon key belongs in client-side code — it's already used this way in `forum.html`, `/shopee`, `/midu_cbct`, `/design`.
- **Each tool folder is independent** — don't assume `index.html`'s class naming (`.card`, `data-f`/`data-c`, `.reveal`) or design tokens apply inside `/qr`, `/barcode`, `/wheel`, `/paper`, etc. Some use Tailwind, some hand-rolled CSS.
- **`v1.html` is archived, not live** — don't confuse it with the current homepage when asked to edit "the portfolio."
- **`cert.html` is a redirect shim** to `/midu_cbct`, not a real page — keep it in sync if `/midu_cbct` ever moves.

## Verification

No server is required to test most pages — open the relevant `index.html` directly in a browser, or:
```bash
python3 -m http.server 8080
# then visit http://localhost:8080
```
Pages that call Supabase (`forum.html`, `/shopee`, `/midu_cbct`, `/design`) need network access to `dmvomgmhsivifionnkiu.supabase.co` to fully function even locally.

Checklist after changing `index.html`:
- [ ] All three language switchers (VI / EN / 中) render correct text
- [ ] Dark mode toggle works and colors look correct in both modes
- [ ] Project filter buttons (`.filters button[data-f]`) show/hide the correct `.card[data-c]` elements
- [ ] Layout is correct at mobile width (<680px) — hamburger menu (`.hamb`/`#mnav`) should appear
- [ ] New content/sections scroll-animate with `.reveal` if applicable

Checklist after changing a standalone tool page (`/qr`, `/barcode`, `/shopee`, `/design`, `/wheel`, `/paper`, `/midu_cbct`):
- [ ] The tool works standalone (open its `index.html` directly)
- [ ] The "back" link to `/forum.html#tools` (where present) still resolves
- [ ] If Supabase-backed, verify against the shared project — don't introduce a second project
- [ ] If it touches a secret API key, confirm the key stays server-side (edge function), never in the page's JS
