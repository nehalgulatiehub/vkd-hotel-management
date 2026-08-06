# Split module amounts: View Booking shows only own-hotel money

## Goal

On View Booking (both user and admin), a booking row must show **only the own-hotel part** of the money — booking price, received and due. Safari, Delhi-Manali, Manali-Delhi, Another Hotel, Additional Vehicle, Visa and Cruise amounts stay out of that row and appear only on their own module detail / due / payment pages with their own prices.

Example: booking with own hotel 1000 + safari 2000 + another hotel 3000 shows Rs. 1000 on View Booking, Rs. 2000 on Safari Details, Rs. 3000 on Another Hotel Details.

## What changes

1. **View Booking row money block** — Booking Price / Total Received / Due Payment are computed from the own-hotel record only, instead of the combined booking total.
2. **Service checkmarks** — the "✓ Safari / ✓ Another Hotel / ✓ Delhi-Manali / ✓ Manali-Delhi / ✓ Add. Vehicle / ✓ Visa / ✓ Cruise" lines are removed from the View Booking service column, so the row only describes the own-hotel stay (hotel, room, rooms, package). Group Expenses stays as-is.
3. **Summary footer** — Total Booking Price / Received / Due at the bottom of View Booking sum the own-hotel figures only (still user-wise for normal users, global for admin/account).
4. **Bookings with no own hotel** stay hidden from View Booking (already the case) and remain visible on their module pages.
5. **Module pages** keep using their own table rows, so their prices are already independent — verified for Safari, Volvo (DM/MD), Vehicle, Another Hotel, Visa, Cruise. Any place still reading the combined `bookings.total_amount` for a module row is switched to the module row's own amount.
6. **Add Payment / View Payment from View Booking** records and displays the payment against the own-hotel part (payment type "booking"), so the own-hotel received/due stays correct and module payments stay on module pages.

## Technical notes

- `fetchBookings` in `src/pages/Bookings.tsx` already loads `hotel_bookings`; it will additionally keep the own-hotel row (`own_hotel_id` not null) with its `total_amount`, and fetch that booking's payments grouped by `payment_type` so the own-hotel received amount = sum of payments with type `booking`/null.
- Row display, filters that depend on amounts, and the summary reducer switch from `booking.total_amount / paid_amount / due_amount` to the derived own-hotel values; the underlying `bookings` totals stay untouched in the database (still the grand total used by vouchers/invoices).
- No schema change and no migration; this is a read/display split in the frontend.

## Out of scope

- Booking voucher, invoices and cancellation still use the full booking total.
