# YorInternational Frontend

## Run

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 4273
```

## Environment

Copy `.env.example` to `.env` only if you intentionally want to override the backend URL.

The frontend now uses same-origin `/api` requests by default.

For local development, Vite proxies `/api` to the backend target configured in [vite.config.ts](C:\Users\Win10\Desktop\YorLegacyMLM\yor_frontend\vite.config.ts).

You usually do not need `VITE_API_BASE_URL` at all.

Only set `VITE_API_BASE_URL` if you intentionally want the browser to call a different API origin directly.

## Verify

```bash
npm test
npm run build
```
