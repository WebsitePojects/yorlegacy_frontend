# YorInternational Frontend

## Run

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 4273
```

## Environment

Copy `.env.example` to `.env` only if you intentionally want to override the backend URL.

The frontend now points at the current forwarded backend API by default.

For same-origin local development, clear `VITE_API_BASE_URL` and Vite can proxy `/api` to the backend target configured in [vite.config.ts](C:\Users\Win10\Desktop\YorLegacyMLM\yor_frontend\vite.config.ts).

The committed default API target is the current forwarded backend tunnel:

```text
https://cz9c2qnq-8787.asse.devtunnels.ms
```

Set `VITE_API_BASE_URL` only when you intentionally want the browser to call a different API origin directly. Trailing slashes are normalized in `src/lib/api.ts`, so both `https://example.com` and `https://example.com/` are safe.

## Verify

```bash
npm test
npm run build
```
