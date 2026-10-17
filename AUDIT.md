# KaroPays — Audit Report, Fixes & Deployment Guide

Originals are untouched in `_backup_original/` (rollback = copy them back). No database, RLS policy, table or data was changed.

## 1. Architecture (as found)
- **Static multi-page site**, no build step. Shared `assets/css/pro.css`, `assets/js/supabase-config.js` (publishable key only — correct for browsers).
- **Auth/DB/Storage:** Supabase. Tables seen: `files`, `download_earnings`, `payout_requests`, `admin_users`. RPCs: `get_available_balance`, `request_payout`. Storage bucket: `files`. Edge Function: `smooth-api` (records a download, computes country/ad-level/earning server-side, returns a signed URL).
- **Flow:** register/login → `creator/dashboard.html` → `upload.html` (Storage upload + `files` insert) → public `file.html?id=` (3 banners + level-based network tags → unlock timer → `smooth-api` → signed download) → earnings in dashboard → payout via RPC → admin approves in `admin.html`.
- Good existing design: earnings/payout maths is server-side (RPC + Edge Function), `esc()` is used for user text in dashboard/admin, no service-role key in the browser.

## 2. Prioritized issues
| # | Severity | Issue | Status |
|---|---|---|---|
| 1 | High | **Banners never rendered** on `file.html`: provider's `invoke.js` uses `document.write()`, which browsers ignore for scripts injected after load; 3 banners also shared one `window.atOptions`; ads were started while the page was `display:none`. | **Fixed** (`slot-loader.js`, one iframe per banner, runs after content is visible) |
| 1b | High | **Dashboard "Sign out" did nothing — and so did the payout form and payout-method change.** `creator/dashboard.html` called `$("kpGlobalSearch").addEventListener(...)` but that search box no longer exists, so the script threw there and every handler after it was never attached. | **Fixed** (null-safe listener). Verified: click → `signOut()` → login page, desktop + mobile |
| 2 | High | Ad failures were silent (blocked / no fill = empty dashed boxes). | **Fixed** – states `filled / empty / blocked`, friendly note |
| 3 | Med | `file.html`: "Ad Level" label changed from "Medium" to "2" after a download (duplicate template). | **Fixed** (`renderMeta()`) |
| 4 | Med | `upload.html`: no sign-in gate; any thrown error left the button stuck on "Uploading…"; no executable-file check despite Program Rules banning malware. | **Fixed** (redirect to login, try/catch, block `.exe .msi .bat .cmd .scr .pif .vbs .vbe .wsf .hta .cpl`). **Client-side only — see §4.** |
| 5 | Med | Header/menu: now the full menu (Payout Rates, Payment Proof, Prize Winners, Premium, Contact, Login, Register) shows **only on `index.html` and `file.html`** with a working mobile menu. `prize-winners`, `program-rules`, `upload` get a simple logo + "Back to home" bar. `prize-winners` title was "start soon". | **Fixed** |
| 6 | Low | Horizontal scroll on phones (hero glow). | **Fixed** |
| 7 | Low | Register: 6-char minimum, consent text without links. | **Fixed** (8 chars client-side, links to rules/terms) |
| 8 | Low | `login.html`: minified, relied on global element ids, no network-error handling. | **Fixed** (same behaviour, readable, handled errors) |
| 9 | Info | Duplicates: `dashboard_1.html` = `dashboard.html`, `register_1.html` = `register.html` (byte-identical). `pro_additions.css` is already merged into `pro.css`. `app.js` is a demo/mock script not loaded by any page. | **Not deleted** — safe to remove after you confirm |
| 10 | Info | Linked pages not in the upload (cannot verify they exist): `browse, how-it-works, payment-proof, payout-rates, premium, privacy, terms, contact, telegram, edit-file`. | Check on your server |
| 11 | Info | Logo text reads **"SENCE 2026"** (typo for "Since"). Image left as supplied. | Your call |

## 3. Theme & logo
- Your logo is blue/black (`#5271ff`) and the existing `pro.css` is already derived from it, while `file.html` used a different purple. I unified everything on the **logo blue**. To switch the whole site to purple, change `--brand`, `--brand-hover`, `--brand-dark` at the top of `pro.css` (one place).
- Logo is now in every header, the dashboard, auth pages and footer; favicon + apple-touch icon generated from the "K" mark.

## 4. Security review — needs your Supabase access (not verifiable from code)
Run these **read-only** checks in the SQL editor and review the output; I changed nothing:
```sql
select tablename, policyname, cmd, roles, qual, with_check from pg_policies
where schemaname in ('public','storage') order by 1,2;
select tablename, rowsecurity from pg_tables where schemaname='public';
```
Check specifically:
1. `files` INSERT must enforce `creator_id = auth.uid()`; creators must not be able to UPDATE `downloads`, `earnings`, `status`.
2. `download_earnings`, `payout_requests`: creators must **not** be able to INSERT/UPDATE earnings or set `status`; only `request_payout` (SECURITY DEFINER) should create payouts.
3. `payout_requests` UPDATE (admin button sets `approved/rejected/paid` directly) must be limited to users in `admin_users`; `admin_users` must not be writable by clients.
4. Storage bucket `files`: restrict INSERT to `bucket_id='files' and (storage.foldername(name))[1] = auth.uid()::text`, set a bucket size limit and allowed MIME types. The extension block in `upload.html` is a UX guard only.
5. `smooth-api`: confirm per-IP/per-file rate limiting and de-duplication. The 14-second unlock timer is client-side and can be bypassed; earnings protection must live in the function.
6. Creators choose the ad level 1–4 at upload; confirm that is intended.
7. Set the minimum password length in Supabase Auth settings (client `minlength` can be bypassed).

## 5. Files changed
`assets/js/slot-loader.js` (new: ad loader) · `assets/js/site.js` (new: mobile menu/active link) · `assets/css/pro.css` (appended v2 block; nothing removed) · `assets/img/*` (new logo, mark, favicons) · `file.html` (ads, header, tokens, meta bug) · `index.html` (shared header, logo, skip link; inline header CSS/JS moved to shared files) · `login.html`, `register.html`, `upload.html`, `prize-winners.html`, `program-rules.html`, `creator/dashboard.html` (logo, favicon, fixes above) · `admin.html` (favicon only).
Unchanged: `supabase-config.js`, `app.js`, `contact-form.js`.

## 6. Testing
**Done (headless Chromium, third-party network blocked/stubbed):** JS syntax of every inline script; logo loads; header/mobile menu opens at 390 px; no horizontal scroll at 390/1280; `file.html` with stubbed Supabase and a stubbed ad provider → banners reported `filled`, `empty` (no fill) and `blocked` correctly, content shown, meta label correct, no page errors.
**Not done (needs live credentials/deployment):** real login/register/email confirmation, upload to Storage, `smooth-api` download + earnings, payout RPC, admin actions, real ad fill from the provider (depends on the provider approving your domain and on ad blockers), dashboard charts with real data. No linter/build/tests exist in the project.

## 7. Deploy & rollback
1. Keep a copy of your live site. 2. Upload this folder's contents preserving paths (`assets/`, `creator/`). 3. Hard-refresh; test: register → login → upload → open file page → unlock → download → dashboard. 4. Test the file page with an ad blocker on and off. 5. **Rollback:** restore the live copy, or copy `_backup_original/*` back (note: originals expect `assets/css/pro.css` etc. at the same paths).
