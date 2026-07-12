
# Prep the project for GitHub showcase

Two things to do: strip visible Lovable references and replace the default README with a polished one describing your Hotel Management System.

## 1. Remove Lovable branding from the app

- **`index.html`** — currently has Lovable defaults in `<title>`, meta description, `og:*`, `twitter:*`, favicon reference (`/favicon.ico` = Lovable icon), and the `gpteng.co` script tag. Replace with your app's real title (e.g. "Mukut Hotels — Hotel Management System"), description, and social tags. Remove the `gptengineer.js` script.
- **Hide the "Edit with Lovable" badge** on the published site via `set_badge_visibility` (requires paid plan). This only affects the hosted `.lovable.app` URL, but doing it keeps things consistent.
- **`package.json`** — rename `"name"` from the Lovable-generated slug to something like `mukut-hms`. Remove `lovable-tagger` dev dependency.
- **`vite.config.ts`** — remove the `componentTagger()` plugin and its import (tied to `lovable-tagger`).
- **Favicon** — replace `public/favicon.ico` reference; you already have `src/assets/mukut-logo.webp`, we can point the favicon link to a proper icon (or leave a placeholder note in README).

Note: I will NOT touch the Supabase project URL or any functional code — only branding/meta.

## 2. Replace `README.md`

New README will include:
- Project title + one-line tagline (Hotel Management System for Mukut Hotels)
- Feature list grouped by module: Bookings & Enquiries, Payments (Booking / Safari / Hotel / Vehicle / Volvo), Hotel & Room Management, Agents / Transporters / Cities, Restaurant POS, Billing & Invoices, Purchase & Inventory, Quotations, Admin & Account panels with RBAC
- Tech stack: React 18 + Vite + TypeScript, Tailwind + shadcn/ui, Supabase (Postgres + Auth + Edge Functions + RLS), React Router, TanStack Query
- Screenshots section (placeholder — you drop images later)
- Getting started: clone, `npm i`, `.env` variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`), `npm run dev`
- Project structure overview
- Deployment notes (Vercel / any static host — `vercel.json` + `_redirects` already present)
- License placeholder (MIT suggested)

## Files touched

- `index.html` (edit)
- `package.json` (edit)
- `vite.config.ts` (edit)
- `README.md` (rewrite)
- Publish settings: hide badge (tool call)

## Not touched

- Any business logic, DB schema, migrations, or routes
- `.lovable/` internal folder (harmless; can be gitignored if you prefer — say the word)

Confirm and I'll apply it.
