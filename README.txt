KaroPays Contact & Dashboard UI Patch

Included files:
- index.html: adds Contact Us to the homepage navigation and removes the visible support email from the footer.
- creator/dashboard.html: removes Help & Support, replaces it with Contact Us, and aligns dashboard accents to #5271ff.
- contact.html: responsive contact page matching the existing KaroPays theme.
- assets/js/contact-form.js: client-side validation only.

IMPORTANT:
1. This is a patch, not a complete website. Merge these files into your existing site root, preserving all other files and folders.
2. The contact form does NOT send or save messages yet. It must be connected to a secure backend before launch.
3. Dashboard stylesheet reference ../assets/css/pro.css and homepage/contact stylesheet reference assets/css/pro.css are retained; keep your existing stylesheet.
4. Only the visible email address in the homepage footer was removed. Backend/authentication configuration was not changed.
5. Back up the current live files before deploying. No files were uploaded to your live website by this patch.
