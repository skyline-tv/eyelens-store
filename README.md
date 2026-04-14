# Eyelens — Storefront

React + Vite customer-facing app. Pair this repo with the **Eyelens API** and optional **Eyelens Admin** repos.

## Setup

1. `cp .env.example .env`
2. Set `VITE_API_URL` (e.g. `http://localhost:5000/api` in dev, or your public API URL in production).
3. Set `VITE_SITE_URL` for SEO (canonical, Open Graph, sitemap) — no trailing slash.
4. `npm install`
5. `npm run dev` — default `http://localhost:3000`

## Build

```bash
npm run build
```

Serve the `dist/` folder behind nginx or any static host. If the API is on another origin, configure CORS on the server (`CLIENT_URLS`) to include this app’s origin.

## Ports

Default dev port is defined in `vite.config.js` (3000).
