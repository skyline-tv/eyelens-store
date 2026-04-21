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

## Razorpay Readiness

The store checkout already supports live Razorpay flow via backend endpoints:

- `GET /api/payments/config`
- `POST /api/payments/create-order`
- `POST /api/payments/verify`

Before enabling "Pay Online" in production, make sure:

1. **Backend env is set**
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
2. **Store points to backend API**
   - `VITE_API_URL=https://api.your-domain.com/api`
3. **CORS allows store origin(s)** in backend `CLIENT_URLS`
   - include both `https://your-domain.com` and `https://www.your-domain.com` if both are used
4. **Razorpay dashboard** is configured for your business profile and accepted payment methods.

If keys are missing, checkout automatically disables "Pay Online" and falls back to COD.

## Ports

Default dev port is defined in `vite.config.js` (3000).
