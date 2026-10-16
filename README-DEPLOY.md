# KaroPays Contact Us — Frontend Only

This patch changes the Contact Us page to offer two support options:

- Email: `karopays.online@gmail.com` via a `mailto:` link.
- Telegram: `https://t.me/karopays_updates`.

## Included files

- `contact.html` — support options matching the current KaroPays theme.
- `assets/js/contact-form.js` — a small note confirming no backend submission code is used.

## Deploy

1. Back up your current `contact.html` and `assets/js/contact-form.js`.
2. Copy these two files into your existing website root at the same paths.
3. Preserve all other website files and folders.
4. Open `contact.html` and test both buttons.

## Important

- No backend, Supabase Edge Function, database table, or secret is required.
- Email opens the visitor's configured email app; it does not send email directly from the website.
- Telegram opens the supplied Telegram channel.
- This package has not been deployed to the live website.
