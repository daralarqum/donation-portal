# Dar Al Arqum Donation Portal — Live Supabase Version

This package is connected to the Centre's Supabase project.

## Connected services
- Project URL: https://pktxrjqiqrmflrjbexpb.supabase.co
- Database table: `public.donations`
- Private storage bucket: `donation-receipts`

## Security model
- Public visitors can INSERT donation records only.
- Public visitors can upload receipt files only.
- No public SELECT policy is included for donation records.
- The receipt bucket remains private.
- This site uses the Supabase publishable browser key, not a secret/service-role key.

## Website files
- `index.html`
- `styles.css`
- `app.js`
- `assets/logo.jpeg`

## Important
This package is ready for static hosting such as GitHub Pages.
Do not publish any Supabase secret/service-role key in the website.
