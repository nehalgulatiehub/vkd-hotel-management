# Mukut HMS — Hotel Management System

A full-stack Hotel Management System built for a multi-property hospitality business. It handles the entire operational flow — enquiries, bookings, room inventory, payments across multiple verticals (own hotels, partner hotels, safaris, vehicles, Volvo transport), restaurant POS, billing, purchase & inventory, and role-based admin/account panels.

Live Link - http://vkddelhi.com/
> Production app powering day-to-day operations for Mukut Hotels.

---

## ✨ Features

### Bookings & Enquiries
- Generate, view and export enquiries
- Booking availability calendar
- Hold bookings, confirmed bookings, cancellations with refund tracking
- Auto-generated booking confirmation vouchers & receipts (PDF)

### Payments (multi-vertical)
- **Booking payments** — receive, due, room-wise
- **Safari** — detail, due, payments
- **Another Hotel** — booking detail, due, hotel payouts
- **Vehicle** — detail, due, transporter payouts
- **Volvo** — Delhi↔Manali round-trip tracking, due & payments
- Approvals workflow (pending / approved) on the admin side

### Property & Partner Management
- Own Hotels, Rooms and Room Types
- Another (partner) Hotels — add, view, export
- Cities, Agents, Transporters — CRUD + exports

### Restaurant (POS)
- Tables, Food Menu, POS order entry
- Order history, KOT/invoice, sales reports

### Billing, Invoices & Quotations
- Create invoices from bookings
- Saved invoices & reusable invoice templates
- Full quotation module with templates

### Purchase & Inventory
- Vendors, Item Master, Purchase Orders, Purchase Invoices
- Goods receipt, inventory tracking, purchase reports & approvals

### Access Control
- Three surfaces: **User panel**, **Account panel**, **Admin panel**
- Role-based menu access, protected routes, per-menu permissions
- Change-password flow for each role

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite 5, TypeScript 5, React Router v6
- **UI:** Tailwind CSS + shadcn/ui + Radix primitives, Lucide icons
- **State/Data:** TanStack Query, React Hook Form + Zod
- **Backend:** Supabase (PostgreSQL, Auth, Row-Level Security, Edge Functions)
- **PDF/Export:** jsPDF, html2canvas, xlsx
- **Charts:** Recharts

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- A Supabase project (free tier works)

### Install
```bash
git clone <your-repo-url>
cd mukut-hms
npm install
```

### Environment
Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
VITE_SUPABASE_PROJECT_ID=<your-project-id>
```

Run the SQL migrations from `supabase/migrations/` against your Supabase project (via the Supabase CLI or SQL editor) so the schema, policies and grants are in place.

### Develop
```bash
npm run dev
```
App runs at `http://localhost:8080`.

### Build
```bash
npm run build
npm run preview
```

---

## 📁 Project Structure

```
src/
├── components/       # Reusable UI + feature components
│   ├── admin/        # Admin-panel dialogs & shells
│   ├── booking/      # Booking dialogs, vouchers, receipts
│   ├── layout/       # Sidebars, headers, layouts (user/admin/account)
│   ├── payment/      # Payment dialogs
│   └── ui/           # shadcn/ui primitives
├── contexts/         # Auth context & providers
├── hooks/            # Reusable hooks (auth, pagination, etc.)
├── integrations/
│   └── supabase/     # Supabase client + generated types
├── pages/            # Route components
│   ├── admin/        # Admin-only routes
│   ├── account/      # Account-role routes
│   ├── purchase/     # Purchase module
│   └── restaurant/   # Restaurant / POS module
└── utils/            # Helpers (payment sync, formatters)
supabase/
├── functions/        # Edge functions (e.g. create-user)
└── migrations/       # SQL migrations
```

---

## 🌐 Deployment

The app is a standard Vite SPA and ships with:
- `vercel.json` — SPA rewrites for Vercel
- `public/_redirects` — SPA fallback for Netlify
- `public/.htaccess` — SPA fallback for Apache

Deploy to any static host (Vercel / Netlify / Cloudflare Pages / your own server) and point the `VITE_SUPABASE_*` env vars at your Supabase project. Edge functions in `supabase/functions/` deploy via the Supabase CLI:

```bash
supabase functions deploy create-user
```

---

## 📸 Screenshots

_Add screenshots of the Dashboard, Booking flow, Payments and Admin panel here._

---

## 📄 License

MIT — see `LICENSE` for details.
