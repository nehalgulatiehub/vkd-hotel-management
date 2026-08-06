# Recovering old payment places

## What I checked

There are 37 payments in total. 30 still have a payment place attached (delhi / corbett / winsome corbett / manali). 7 payments have no place at all — these are the ones whose old city was removed during the Payment Place cleanup.

The old city names themselves were deleted from the cities list, and the database keeps no audit history of the removed rows, so the original names cannot be read back from the current database. They can only come from a database backup/snapshot, or be re-assigned by hand.

## The 7 payments missing a place

| Date | Amount | Mode | Reference (hint) |
| --- | --- | --- | --- |
| 06/08/2026 | 6,000 | upi | received in icici mukut on 5/8/26 ref no-6217770345 |
| 04/08/2026 | 6,000 | card | (blank) |
| 04/08/2026 | 10,800 | cash | received 10800 by cash at winsome 4th Aug |
| 03/08/2026 | 100,000 | cash | payment recd by cash on 31 july, in corbett |
| 31/07/2026 | 5,000 | bank transfer | Received in bank on date 25 july 2026 |
| 29/07/2026 | 112,000 | bank transfer | received 100000+12000 in icici spring 28th july |
| plus 1 more with no usable hint | | | |

## Options

**Option A — Restore from a backup (only true recovery)**
Use Cloud → Advanced settings to restore/inspect a snapshot taken before the city cleanup, read the old city names for these 7 payments, and re-apply them. This is the only way to get the exact original values back.

**Option B — Re-assign the 7 payments manually (recommended, fast)**
Set the place on these 7 payments using the visible hints, and leave the rest blank for you to confirm:
- "cash at winsome" -> winsome corbett
- "cash ... in corbett" -> corbett
- the icici/bank-transfer ones -> delhi (typical for bank receipts) — only if you confirm
- the remaining ones with no hint -> left blank until you tell me the place

**Option C — Leave them blank**
The Payment Place column simply shows "-" for those 7 rows; you set the correct place next time you edit each payment.

## Technical notes

- Deleted `cities` rows are gone; `payments.city_id` for these 7 rows was set to NULL to avoid foreign-key errors, so no hidden pointer to the old city remains.
- Any re-assignment is a data migration that updates `payments.city_id` for those specific payment ids to one of the 4 current cities.
- No schema or UI changes are needed for this task.

## Recommendation

Go with Option B: tell me the correct place for each of the 7 rows above (or approve my hint-based mapping), and I will update them in one migration.
