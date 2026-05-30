# Yor International Deployment Guide

This guide deploys the Yor frontend to Vercel, connects the public site to `yorinternational.net`, and keeps the browser on same-origin `/api` requests:

- Public domain: `https://yorinternational.net`
- Optional `www`: `https://www.yorinternational.net`
- Temporary backend rewrite target: `https://cz9c2qnq-8787.asse.devtunnels.ms/`

## 1. What is already configured in code

The frontend now uses same-origin `/api/...` requests by default.

That means:

- local Vite development proxies `/api` to `https://cz9c2qnq-8787.asse.devtunnels.ms`
- Vercel rewrites `/api/*` to `https://cz9c2qnq-8787.asse.devtunnels.ms/api/*`
- browser requests stay on the frontend origin, which is safer for cookie-based auth than hardcoding a cross-origin API URL into the browser

Important:

- do not set `VITE_API_BASE_URL` in Vercel production while using rewrites
- if you set `VITE_API_BASE_URL`, the browser will call that host directly and can hit CORS or tunnel-auth issues

Relevant files:

- [vite.config.ts](C:\Users\Win10\Desktop\YorLegacyMLM\yor_frontend\vite.config.ts)
- [vercel.json](C:\Users\Win10\Desktop\YorLegacyMLM\yor_frontend\vercel.json)
- [api.ts](C:\Users\Win10\Desktop\YorLegacyMLM\yor_frontend\src\lib\api.ts)

## 2. Push the frontend repo to GitHub

From the frontend repo:

```powershell
cd C:\Users\Win10\Desktop\YorLegacyMLM\yor_frontend
git status
git add .
git commit -m "Polish Yor International public/auth experience and add Vercel deployment wiring"
git push origin main
```

If you are still on another branch, merge or cherry-pick into `main` first before the final push.

## 3. Import the frontend into Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click `Add New...` -> `Project`.
3. Import `WebsitePojects/yorlegacy_frontend`.
4. Confirm the project root is the frontend repo itself.
5. Vercel should detect it as a Vite app.

Recommended build settings:

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

## 4. Set frontend environment variables in Vercel

For this current setup, leave the browser API base unset so the app keeps using same-origin `/api`.

Add this only if you want to keep the intent explicit:

- Name: `VITE_API_BASE_URL`
- Value: leave empty

If Vercel refuses an empty value, do not add the variable at all.

## 5. Deploy once in Vercel

1. Click `Deploy`.
2. Wait for the first production deployment to finish.
3. Open the generated `.vercel.app` URL.
4. Verify:
   - public pages load
   - `/login` loads
   - `/register` loads
   - requests to `/api/...` succeed through the Vercel rewrite

## 6. Attach `yorinternational.net` in Vercel

1. Open the Vercel project.
2. Go to `Settings` -> `Domains`.
3. Add:
   - `yorinternational.net`
   - `www.yorinternational.net`
4. Vercel will show the exact DNS records it expects.

Common values are usually:

- Apex/root domain: `A` record -> `76.76.21.21`
- `www` subdomain: `CNAME` -> the Vercel target shown in the dashboard

Important:

- use the exact value Vercel shows in the Domains screen
- do not guess the `www` CNAME target if Vercel displays something different

## 7. Configure Hostinger DNS

In Hostinger:

1. Open `Domains`.
2. Select `yorinternational.net`.
3. Open `DNS / Nameservers` or `DNS Zone Editor`.
4. Remove conflicting old records for the same host if needed.
5. Add/update the records Vercel requested:
   - `A` record for `@`
   - `CNAME` record for `www`
6. Save changes.

Recommended end state:

- `@` -> Vercel apex target
- `www` -> Vercel CNAME target

Wait for DNS propagation, then return to Vercel and confirm both domains become `Valid`.

## 8. Make sure the backend allows the public domains

The backend CORS allowlist should include:

- `http://localhost:5173`
- `http://127.0.0.1:5173`
- `https://yorinternational.net`
- `https://www.yorinternational.net`

Backend env example already reflects this:

- [env.ts](C:\Users\Win10\Desktop\YorLegacyMLM\yor_backend\src\config\env.ts)
- [.env.example](C:\Users\Win10\Desktop\YorLegacyMLM\yor_backend\.env.example)

If you run the backend locally, make sure your real backend `.env` contains:

```env
FRONTEND_ORIGIN=http://localhost:5173,http://127.0.0.1:5173,https://yorinternational.net,https://www.yorinternational.net
```

Then restart the backend.

## 9. Run the temporary backend tunnel

Your current rewrite target is:

- `https://cz9c2qnq-8787.asse.devtunnels.ms/`

That means your local backend on port `8787` must stay reachable through that dev tunnel until `api.yorinternational.net` is live.

Each time you restart or recreate the tunnel:

1. confirm the tunnel still points to local port `8787`
2. if the tunnel URL changes, update:
   - [vite.config.ts](C:\Users\Win10\Desktop\YorLegacyMLM\yor_frontend\vite.config.ts)
   - [vercel.json](C:\Users\Win10\Desktop\YorLegacyMLM\yor_frontend\vercel.json)
3. redeploy the frontend in Vercel

## 10. Switch rewrites to the real API domain after VPS deploy

Once the backend is live on `https://api.yorinternational.net`, update [vercel.json](C:\Users\Win10\Desktop\YorLegacyMLM\yor_frontend\vercel.json):

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://api.yorinternational.net/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Redeploy Vercel after that change.

## 11. Verify production after the domain is live

Check these URLs:

- `https://yorinternational.net`
- `https://www.yorinternational.net`
- `https://yorinternational.net/login`
- `https://yorinternational.net/register`

Verify:

- navbar and footer branding render correctly
- public pages stay dark even after logging out from a light-mode office session
- login submits successfully
- register preview and register submit hit the backend
- sidebar logout works

## 12. If login fails in production

Check these first:

1. `VITE_API_BASE_URL` is not set in Vercel production
2. browser network requests are going to `/api/...` on the frontend domain, not directly to a different host
3. the frontend was redeployed after any rewrite target change
4. backend `FRONTEND_ORIGIN` includes both production domains
5. the temporary tunnel is public/reachable, or the rewrite target has already been switched to `https://api.yorinternational.net`
6. if browser requests redirect to `global.rel.tunnels.api.visualstudio.com`, the current dev tunnel is private and Vercel cannot use it until you make it public or move to `https://api.yorinternational.net`

## Source references

- [Vercel: Custom Domains](https://vercel.com/docs/domains)
- [Vercel: Rewrites](https://vercel.com/docs/rewrites)
- [Vercel: Environment Variables](https://vercel.com/docs/environment-variables)
- [Hostinger: DNS Zone Editor](https://www.hostinger.com/tutorials/dns-zone-editor)
