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

The current optional direct-origin override is the forwarded backend tunnel:

```text
https://cz9c2qnq-8787.asse.devtunnels.ms
```

Do not set `VITE_API_BASE_URL` in Vercel production unless you intentionally want the browser to bypass same-origin rewrites and talk to a different origin directly. Trailing slashes are normalized in `src/lib/api.ts`, so both `https://example.com` and `https://example.com/` are safe.

## Verify

```bash
npm test
npm run build
```
