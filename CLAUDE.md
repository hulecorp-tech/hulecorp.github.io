# CLAUDE.md — hulecorp.github.io

## Project Overview

Static single-page portfolio for **Huy Le Creative**, a graphic designer based in Vietnam. Hosted on GitHub Pages at `hulecorp.github.io`. Specialties showcased: event branding, mascot design, banner & panel, packaging, brand identity, and promotion.

## Repository Structure

```
hulecorp.github.io/
├── index.html      # Entire site: HTML, CSS, and JS in one file (~600 lines)
└── avatar.jpg      # Profile photo used in hero and about sections
```

No build tools, no package.json, no CI/CD. This is a zero-dependency static site.

## Tech Stack

- **HTML5** — semantic section-based markup
- **CSS3** — inline in a `<style>` block inside `<head>` (~400 lines)
- **Vanilla JS** — inline in a `<script>` block at the end of `<body>` (~150 lines)
- **Google Fonts** — Inter (primary) and Noto Sans SC (Chinese support), loaded via CDN `<link>` tags

No frameworks, no bundlers, no transpilers, no linters.

## Architecture

Everything lives in `index.html`. There are no separate template files, no component files, and no content files. Sections are hard-coded HTML with `data-i18n` attributes marking translatable strings.

**File layout inside index.html:**
1. `<head>` — meta tags, font preconnects, inline `<style>` block
2. `<body>` — nav, sections (#home, #about, #skills, #projects, #clients, #contact), footer
3. End of `<body>` — inline `<script>` block (i18n, dark mode, filtering, animations)

## CSS Conventions

### Design Tokens (`:root` custom properties)
```css
--orange: #FF6B2B;       /* primary brand accent */
--orange-light: #FF9F68;
--blue: #1E6EFF;         /* secondary accent */
--blue-light: #64A8FF;
--bg: #FAFAFA;           /* page background (light) */
--text: #1A1A2E;
--text2: #6B7280;        /* secondary/muted text */
--card: #FFFFFF;
--border: #E5E7EB;
--radius: 16px;
```

### Dark Mode
Implemented via a `data-theme` attribute on `<html>`:
```css
[data-theme="dark"] { --bg: #0F0F1A; --card: #1A1A2E; /* etc. */ }
```
Toggle button: `.theme-btn`. Dark mode state is **not persisted** (resets on reload — no localStorage).

### Responsive Breakpoints
```css
@media (max-width: 1024px) { /* tablet */ }
@media (max-width: 768px)  { /* mobile — hamburger menu activates */ }
@media (max-width: 520px)  { /* small mobile */ }
```

### Naming Conventions
- Section containers: `.section`, `.section-tag`, `.section-title`, `.section-desc`
- Component prefix pattern: `.hero-*`, `.skill-*`, `.project-*`, `.contact-*`
- State classes: `.active`, `.open`, `.visible`, `.show`
- Utility: `.fade-up` (scroll animation), `.grad-text` (gradient text), `.container`

## JavaScript Conventions

### i18n System
All translatable text lives in a single `T` object:
```js
const T = {
  vi: { "nav.about": "Về tôi", ... },   // Vietnamese (default)
  en: { "nav.about": "About", ... },
  zh: { "nav.about": "关于我", ... }
}
```
Elements are marked with `data-i18n="key.subkey"` attributes. `applyLang(lang)` iterates all `[data-i18n]` elements and sets their `textContent`.

Language toggle buttons: `.lang-btn[data-lang="vi|en|zh"]`.

### Project Filter
Filter buttons carry `data-filter="category|all"`. Project cards carry `data-category="event|mascot|brand|packaging|promo"`. Clicking a filter button shows/hides matching cards.

### Scroll Animations
Elements with `.fade-up` are revealed by an `IntersectionObserver` when they enter the viewport (adds `.visible` class).

## Adding Content

### New Project Card
Add inside the `#projects` section grid:
```html
<div class="project-card" data-category="event">
  <div class="project-thumb" style="background:linear-gradient(135deg,#FF6B2B,#FF9F68)">
    <span class="project-thumb-icon">🎪</span>
  </div>
  <div class="project-body">
    <div class="project-cat" data-i18n="proj.newProject.cat">Event Branding</div>
    <div class="project-name" data-i18n="proj.newProject.name">Project Name</div>
    <div class="project-desc" data-i18n="proj.newProject.desc">Description</div>
  </div>
</div>
```
Then add matching keys to all three language objects (`vi`, `en`, `zh`) in the `T` object.

### New Filter Category
1. Add a filter button: `<button class="filter-btn" data-filter="newcat" data-i18n="filter.newcat">Label</button>`
2. Add the translation key to all three language objects
3. Add `data-category="newcat"` to relevant project cards

### New Page Section
1. Add the HTML `<section class="section" id="newid">` with `data-i18n` attributes on all text
2. Add a nav link with matching `href="#newid"` and `data-i18n` attribute
3. Add CSS for the section using existing component naming conventions
4. Add all translation keys to all three language objects
5. Add `.fade-up` to elements that should animate on scroll

### New Image Asset
Commit the image file to the repo root. Reference it via relative path (`src="./image.jpg"`).

## Deployment

No build step. The workflow is:
```
Edit index.html → git commit → git push origin master
```

GitHub Pages serves the repo root directly. Changes are live within ~60 seconds of push. No environment variables or secrets are required.

## Common Pitfalls

- **Always add translation keys to all three languages** (`vi`, `en`, `zh`) simultaneously. Missing keys cause the raw key string (e.g. `"nav.about"`) to render on screen.
- **Dark mode is not persisted** — it resets on page reload by design. Do not add localStorage without considering UX intent.
- **Images must be committed** — there is no CDN or asset pipeline. New images go in the repo root.
- **The `<script>` block must remain after all HTML content** — the JS queries DOM elements on load. Moving it to `<head>` without `defer` will break it.

## Verification

No server is required to test locally. Open `index.html` directly in a browser, or:
```bash
python3 -m http.server 8080
# then visit http://localhost:8080
```

Checklist after any change:
- [ ] All three language switchers (VI / EN / 中) render correct text
- [ ] Dark mode toggle works and colors look correct in both modes
- [ ] Project filter tabs show/hide the correct cards
- [ ] Layout is correct at mobile width (<768px) — hamburger menu should appear
- [ ] New content/sections scroll-animate with `.fade-up` if applicable
