

# Admin Panel Design Consistency Overhaul

## Problem

The admin panel currently uses **3+ different design patterns** across its pages:

1. **Pattern A** (Card-based): `AdminAgents`, `AdminCities`, `AdminTransporters`, `AdminOwnHotels` -- Uses shadcn Card components, `<Table>` components, modern Search input with icon, `h1` title as plain text
2. **Pattern B** (Themed table): `AdminAnotherHotels`, `AdminManageHotels`, `ViewDueAmount`, Money Detail pages -- Uses raw `<table>` elements, `#1e6e99` blue header bar, `#D4A59A` table headers, `#F5E6E0` row backgrounds, `#8B1538` maroon search headers, compact filter dropdowns
3. **Pattern C** (AdminPaymentPageLayout): Payment pages -- Uses `AdminHeader` component with gradient, 5-row filter section, themed styling

**Target**: Standardize ALL admin pages to use **Pattern B** (the themed table design) since it's the most complete and matches the established brand identity (blue headers, maroon search bars, peach rows).

## What Changes

### Step 1: Create a reusable `AdminPageShell` component
A wrapper component that provides:
- Blue gradient page header (`#1e6e99`) with title + optional action buttons (Add, Export, Back)
- Maroon search section header (`#8B1538`) with "Search" label
- Filter area with consistent styling (peach background `#F5E6E0`, `text-xs` dropdowns)
- Table wrapper with `#D4A59A` header rows and alternating `#F5E6E0` body rows
- Integrated `TablePagination` at footer

### Step 2: Convert Card-based pages (~6 pages)
Refactor these pages to use the themed table design:
- `AdminAgents.tsx` -- Replace Card/Table with themed raw table, add maroon Search header
- `AdminCities.tsx` -- Same conversion
- `AdminTransporters.tsx` -- Same conversion
- `AdminOwnHotels.tsx` -- Same conversion
- `AdminUserList.tsx` -- Same conversion
- `AdminQuotes.tsx` -- Check and convert if needed

### Step 3: Normalize existing themed pages (~8 pages)
Ensure consistent spacing, font sizes, filter layout across:
- `AdminAnotherHotels.tsx` -- Already themed, minor alignment fixes
- `AdminManageHotels.tsx` -- Already themed, minor alignment fixes
- `ViewDueAmount.tsx`, `ViewHotelDue.tsx`, `ViewSafariDue.tsx`, `ViewVehicleDue.tsx`, `ViewDelhiManaliDue.tsx`, `ViewManaliDelhiDue.tsx` -- Ensure consistent filter row layout
- Money Detail pages (`AdminSafariMoneyDetail`, `AdminAnotherHotelMoneyDetail`, etc.) -- Ensure same filter styling
- Payment pages via `AdminPaymentPageLayout` -- Already consistent within themselves, just ensure header matches

### Step 4: Ensure `AdminHeader` is used consistently
All pages should use the blue gradient `AdminHeader` component at the top, followed by the maroon search section where filters exist.

## Consistent Design Spec

```text
+--------------------------------------------------+
| [Blue Gradient Header #1e6e99]  Title    [Actions]|
+--------------------------------------------------+
| [Maroon #8B1538] Search                           |
|--------------------------------------------------|
| [#F5E6E0 bg] Filter row 1: Date, Search toggle  |
| [#F5E6E0 bg] Filter row 2: Dropdowns, Search btn|
+--------------------------------------------------+
| [#D4A59A] S.no | Col1 | Col2 | ... | Actions    |
|--------------------------------------------------|
| [#F5E6E0] 1    | ...  | ...  | ... | Edit/Del   |
| [white]   2    | ...  | ...  | ... | Edit/Del   |
| [#F5E6E0] 3    | ...  | ...  | ... | Edit/Del   |
+--------------------------------------------------+
| [Pagination] Showing 1-10 of 50    < 1 2 3 4 > |
+--------------------------------------------------+
```

## Files to Edit (~15-20 files)

- **New**: `src/components/admin/AdminPageShell.tsx` (reusable wrapper)
- **Major rewrites**: `AdminAgents.tsx`, `AdminCities.tsx`, `AdminTransporters.tsx`, `AdminOwnHotels.tsx`, `AdminUserList.tsx`
- **Minor fixes**: `AdminAnotherHotels.tsx`, `AdminManageHotels.tsx`, `ViewDueAmount.tsx`, and other View/Due pages for spacing/font consistency
- **Update**: `AdminHeader.tsx` if needed for action button slots

