KaroPays additive patch: favicon/search icon, password recovery, traffic sources, and selected current files

IMPORTANT
- This is a separate patched ZIP. It does not change your live site or database automatically.
- Existing project ZIP was used as a baseline and selected current uploaded files were incorporated.
- No existing database records are deleted or updated by the included migration.

Favicon / Google result icon
- Root favicon.ico and favicon.png plus assets/img favicon assets are included.
- HTML pages link to the root favicon. Google may take days or weeks to recrawl; the code cannot force instant SERP updates.
- Submit https://karopays.online/favicon.ico in browser to verify it loads, then inspect the homepage in Google Search Console and request indexing.

Forgot password
- Login includes a Forgot password link.
- forgot-password.html sends Supabase Auth recovery email to reset-password.html.
- In Supabase Dashboard > Authentication > URL Configuration, add https://karopays.online/reset-password.html to Redirect URLs. Ensure Site URL is https://karopays.online.
- Configure SMTP/email delivery and test with a real account.

Traffic sources
- Run supabase/migrations/20261026_add_traffic_sources.sql in Supabase SQL Editor before using traffic-sources.html.
- It creates only a new traffic_sources table and creator-only RLS policies. It does not add an admin approval UI; status is pending by default and creators cannot change review status. Admin review should be implemented through an admin-only RPC before approving sources for payout decisions.
- The dashboard link points to traffic-sources.html.

Validation
- Review the diff against your deployed files before publishing. Test sign-in, file upload/download, payouts, and admin actions on a staging copy first.
- Do not upload service-role keys. Keep assets/js/supabase-config.js limited to the public publishable key.
