# Pobbi — Inspiration Collector (PWA)

Next.js 15 app, local-first (IndexedDB), installable to desktop / home screen, deployable on Vercel.

## Run locally
```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm start   # production mode (service worker only registers in production)
```

## Deploy to Vercel
1. Push this folder to a GitHub repo.
2. vercel.com → Add New → Project → import the repo. Framework preset: **Next.js** (no env vars needed).
3. Open the deployed URL:
   - **Desktop Chrome / Edge**: click the install icon in the address bar (or Settings → “Install Pobbi on this device”).
   - **macOS Safari**: File → Add to Dock.
   - **iPhone Safari**: Share → Add to Home Screen.
   - **Android Chrome**: menu → Install app (Pobbi also appears in the Share sheet → share a link straight into Add Inspiration).

## Terms
- **Category** = “Classify Tag” in the UI (coloured, few, used for Home sections & filters).
- **Tag** = free-form keyword (e.g. Tools, Dashboard), managed in Settings → Manage Tags.

## Reminders
Local only (no push server): a daily notification when the app is opened and something is due,
“Remind in 10m” while Pobbi stays open, and the in-app Notification Center.

## Data safety
- All data lives in the user’s browser (IndexedDB: `inspirations`, `images`, `tags`, `meta`). Deploys never touch it.
- `lib/db.ts` rules: only **add** stores/indexes, bump `DB_VERSION`, add a new `if (oldVersion < N)` block. Record shape changes go in `normalizeInspiration()`.
- The app calls `navigator.storage.persist()` so the browser won’t evict data under pressure.
- Settings → Export backup (JSON incl. images) / Import backup (merge).
- Keep the production domain stable — IndexedDB is per-origin (a new Vercel URL = empty library).

## Structure
```
app/
  page.tsx            00-1 Splash (routes first-time → /welcome, returning → /home)
  welcome/            00-2 Welcome
  onboarding/         00-3 Create First Inspiration
  home/               01 Home (empty / one / full states, search, color search, tag chips, sort)
  inspiration/?id=    04 Inspiration Detail (edit, schedule, mark read, copy, delete)
  library/            02 Library — flat list, multi-category chips, Filter drawer, color search
  reading/            03-1 Reading Queue — calendar (month/week), Mark drawer, options, today reminder popup
  reading/history/    03-2 Read History — weekly chart, category legend, day groups
  settings/           06 Settings — categories, tags, export/import (merge/replace), reminders, storage
  settings/categories Manage Categories — drag to reorder, add / edit / delete
  settings/tags       Manage Tags — free-form tags: rename, merge, delete everywhere
  notifications/      Notification Center — today + overdue (move to this weekend)
  api/meta            fetch page title, og/images, detected fonts (SSRF-guarded)
  api/image           same-origin image proxy (for palette extraction + storing the blob)
components/
  AddDrawer.tsx       Drawer_Add Inspiration (global, opened by the + FAB)
  InspirationForm.tsx shared Add/Edit layout
  FormParts.tsx       URL / Thumbnail / Name / Font+Color / Classify Tag / Tags / Purpose / Note
  ColorPicker.tsx     Color picker drawer (SV + hue + alpha + hex, eyedropper / tap thumbnail)
  Calendar.tsx        Calendar grid + Date Picker drawer
  Panels.tsx          Edit Font / Edit Tags / Add & Edit Classify Tag drawers
  Reading.tsx         Reading header, Mark-as-read drawer, reading options
  Icons.tsx           icons exported from Figma
lib/
  db.ts  image.ts (compress, 5-color palette)  filter.ts  types.ts
public/sw.js          service worker (app shell cache only)
```
