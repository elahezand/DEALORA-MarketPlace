# Dealora

Marketplace frontend: people post ads, verified stores sell new products, buyers chat, make offers, pay online, by wallet or cash on delivery.
Three dashboards (user, seller, admin) share one Next.js app.

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, Server Components, `proxy.ts`) · React 19 · TypeScript (strict) |
| UI | Tailwind CSS 4 · HeroUI · framer-motion · lucide / react-icons |
| Data | TanStack Query 5 over axios (`src/utils/hooks/useReactQueryHooks.ts`) · server fetches in `src/utils/serverData.ts` |
| Forms | react-hook-form + Zod (`src/validations`) |
| Maps | Leaflet / react-leaflet |

## Getting started

```bash
cp .env.example .env      # point it at your API
npm install
npm run dev               # http://localhost:3000
```

| Variable | Used by | Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | browser (axios), baked in at build time | `http://localhost:4000/api` |
| `SERVER_API_URL` | server components (SSR) — can be an internal address | `http://api:4000/api` |
| `NEXT_PUBLIC_SITE_URL` | canonical urls, `sitemap.xml`, Open Graph | `https://dealora.com` |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | dev server |
| `npm run build` / `npm start` | production build / serve it |
| `npm run lint` | ESLint (Next core-web-vitals + TypeScript rules) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run check` | lint + typecheck — run before pushing |

## Project structure

```
src/
├── app/                      routes only (pages, layouts, loading/error, sitemap, robots)
│   ├── (main)/               public site — home, listings, stores, cart, support, legal
│   └── (dashboard)/dashboard user · (seller)/seller · (admin)/admin pages
├── components/
│   ├── dashboard/            everything the dashboards render
│   │   ├── admin/ seller/ user/   one folder per role
│   │   ├── shared/           tables, filters, header, search used by all roles
│   │   ├── layouts/          DashboardShell + AuthGuard (role check)
│   │   └── context/          sidebar state
│   ├── newPost/              "Post an Ad" wizard (one file per step)
│   ├── createShop/           "Open a Shop" wizard
│   ├── posts/ stores/ index/ public pages' sections
│   └── shared/               Header, Footer, SafeSvg, JsonLd, …
├── services/<Domain>/        one React Query hook per API action (useCreateOffer, useDeleteListing, …)
├── validations/              Zod schemas (forms + wizard steps)
├── types/                    API & domain types
├── utils/                    pure helpers (price, formData, seo, sanitizeSvg, stepResolver, …)
└── proxy.ts                  server-side route protection for /dashboard
```

## How things work

### Data fetching
- **Client:** every endpoint has its own hook in `services/` built on `useGet` / `usePost` / `usePatch` / `usePut` / `useDelete`.
  Those hooks show API errors as toasts (`errorFallback` for a custom message, `silentError` to skip).
- **Server:** `getServerData` (public, optionally cached with `unstable_cache`) and `getAuthServerData` (forwards the user's cookies).
  Both return `null` instead of throwing, so one broken section never takes a page down.
- **Auth refresh:** the axios interceptor (`services/interceptor.ts`) refreshes the access token on a 401 and replays the request.
  Parallel 401s share **one** refresh call.

### Auth & route protection — two layers
1. **`src/proxy.ts`** (runs on the server before rendering) — `/dashboard/**` without an auth cookie is redirected to `/?auth=required`,
   where the login modal opens. It only checks that a cookie exists; tokens are verified by the API.
2. **`AuthGuard`** (client) — checks the role: `USER`, `SELLER` or `ADMIN`.

> The proxy reads cookies on the **frontend's** domain. If the API sets its cookies on another domain in production,
> put both behind the same parent domain (or proxy `/api` through Next), otherwise every dashboard visit is redirected.

### Forms
react-hook-form + Zod everywhere. The two multi-step wizards (**Post an Ad**, **Open a Shop**) use `createStepResolver`
(`utils/stepResolver.ts`): each step validates only its own schema while the values of all steps are kept.
Step components read and write the form through `useFormContext`.

### Security
- Category icons are SVG strings from the API — they are rendered only through `<SafeSvg>` (DOMPurify, svg profile, no scripts / event handlers / `foreignObject`).
- JSON-LD is serialized with `<` escaped.
- Security headers (`X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`) in `next.config.mjs`.

### SEO
- `generateMetadata` on listing, store and article pages (title, description, canonical, Open Graph image).
- schema.org `Product` JSON-LD on listing pages.
- `sitemap.xml` (static pages + latest listings + verified stores) and `robots.txt` (dashboards, cart and payment pages excluded).

## Docker

```bash
docker compose up --build
# or
docker build --build-arg NEXT_PUBLIC_API_URL=https://api.example.com/api -t dealora .
docker run -p 3000:3000 -e SERVER_API_URL=http://api:4000/api dealora
```

The image uses Next's `standalone` output: only the compiled server and static files, runs as a non-root user.

## Known follow-ups

- `react-hooks/set-state-in-effect` (new React Compiler rule) is a warning for now — about 20 components still sync state inside an effect.
- `<img>` is used where `next/image` would be better (lint warnings).
- Error monitoring (e.g. Sentry) is not set up yet.
- No automated tests yet.
