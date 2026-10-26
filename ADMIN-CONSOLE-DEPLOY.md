KaroPays unified admin console patch

Included: updated admin.html and additive SQL migration for admin traffic-source review.

Before deployment:
1. Keep a backup of your current repository. This patch is additive and does not delete existing files.
2. Verify Supabase schema and RLS in your own project. The admin console uses existing public.admin_users membership.
3. If traffic_sources is already installed, apply supabase/migrations/20261026_admin_traffic_source_review.sql in Supabase SQL Editor. It adds an admin read policy and a SECURITY DEFINER review RPC that checks auth.uid() against public.admin_users.
4. The console's payout completion calls the existing complete_payout(p_request_id) RPC; it does not directly mark payouts paid. Approve/reject only update a pending request's status, and still require your existing RLS.
5. File controls only toggle active/disabled and never permanently delete a file. No balance or earnings edits are provided.
6. Content reports, support tickets, payout rates, referrals and activity/event tables are shown read-only if their table and schema are accessible. Unknown/missing schemas display an error instead of modifying data.
7. Test sign-in, dashboard loads, payout approve/reject, payout completion (only after actual payment), traffic-source review, and file disable/re-enable on a staging copy first.

Important limitations:
- Frontend access checks are not a substitute for Supabase RLS/RPC checks.
- A completed payout must only be finalized after the real payment was sent.
- This patch does not change smooth-api, download recording, anti-fraud, earning calculation, payout rates, or existing data.
