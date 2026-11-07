# Existing Supabase booking upgrade

This folder upgrades the original portfolio Supabase service. It does not replace
the database or authentication provider, create another database, or delete data.

## Activation (requires the original project to be reachable)

1. Back up the existing database. Ensure the original portfolio CMS migrations
   have already been applied (the imported copies are in `.migration-backup/supabase/migrations`).
2. Apply `migrations/20261107_booking_reservations.sql` to that SAME database.
   It adds a protected booking table, public date/time-only availability, an atomic
   message+reservation function, and administrator-only confirmation/release/block functions.
3. Set the Edge Function's `ALLOWED_ORIGINS` to the exact comma-separated preview
   and published origins in use, no trailing slash. Use the provider's secrets
   manager; never commit credentials. Built-in original portfolio origins remain allowed.
4. Deploy `functions/portfolio-submit` to that SAME project, retaining its existing
   authentication/JWT configuration and service-role environment.
5. Verify the availability RPC anonymously returns only date/time data, project
   submissions return `bookingStatus: "reserved"`, and a racing request receives
   HTTP 409 with `code: "SLOT_TAKEN"`.
6. Verify `/admin` with an existing approved account. “Bookings” can confirm,
   release, or block a 30-minute appointment. Releasing a slot reopens it; archiving
   an inbox message does NOT release an appointment.

## Contract and safety

- Slots use the published `start.scheduling.timeZone` (default `Africa/Cairo`).
  Visitors cannot override the timezone to create a second copy of one appointment.
- Requested, confirmed, and administratively blocked intervals exclude overlap
  through a PostgreSQL GiST constraint. Back-to-back intervals are allowed.
- A conflict rolls back BOTH the new message and the new booking.
- Request IDs are idempotent and serialized across requests. A cancelled request
  cannot be used to claim an old slot is still reserved.
- New public requests require current availability; connection failures never
  fabricate free slots. Availability refreshes every 15 seconds and on focus.
- Custom budgets use `budget: "__custom__"` and `customBudget` (trimmed, 1–120
  characters), displayed in review, the submitted message and the admin inbox.
- Existing future preferred-time requests are backfilled conservatively. The earliest
  non-conflicting request is held; overlapping requests are flagged for rescheduling,
  not deleted. Review migration notices and the inbox before confirming meetings.

The workspace cannot activate these database/Edge Function changes while the
original Supabase hostname is unreachable. Code and isolated tests are not proof
that a production database has been upgraded.
