# Technical documentation — Nicolas Selicki's Portfolio

> [Versión en español](../es/tecnica.md) · [Business documentation](./business.md)

## 1. Context

A **Next.js (App Router)** web app that serves a bilingual portfolio and a private panel to edit its content. There is no database and no user system: content comes from a **swappable data layer** (mocks or a JSON file today) and panel access is controlled with credentials from `.env` plus a signed cookie.

**Current state: everything runs on mock data.** The home page, the API and the contact form consume `data/mock/` with no external services. Integrating real services means implementing the interfaces in `lib/content/repository.ts` and `lib/contact/service.ts`, without touching the UI.

> ⚠️ This Next.js version (16) has breaking changes compared to earlier versions (for example `middleware` was renamed to **`proxy`**). When in doubt, check `node_modules/next/dist/docs/` (see `AGENTS.md`).

## 2. Stack and language

| Layer | Technology |
|---|---|
| Language | **TypeScript 5** (`strict` mode) |
| Framework | **Next.js 16.2** (App Router, Route Handlers, Proxy) with Turbopack |
| UI | **React 19.2** |
| Styling | **Tailwind CSS 4** (via `@tailwindcss/postcss`) + CSS variables in `app/globals.css` |
| Fonts | Geist / Geist Mono (`next/font/google`) |
| Quality | ESLint 9 (`eslint-config-next`) |
| Security | Web Crypto API (HMAC-SHA256) — no external dependencies |
| Runtime | Node.js ≥ 20 |

## 3. Project structure

```
app/
  layout.tsx               Root layout (fonts, animated background, LanguageProvider)
  page.tsx                 Public home (reads content on the server)
  globals.css              Tailwind + design variables
  admin/                   Panel (INTERNAL route, never directly reachable)
    layout.tsx             noindex metadata
    page.tsx               Login
    panel/page.tsx         Edit form
  api/
    content/route.ts       Public GET
    contact/route.ts       POST contact form (mock)
    diplomas/[id]/route.ts GET diploma (inline or download)
    admin/login/route.ts   POST login
    admin/logout/route.ts  POST logout
    admin/content/route.ts GET / PUT content (protected)
    admin/messages/route.ts GET received contact messages (protected)
components/
  admin/                   LoginForm, ContentEditor, ui (fields and lists)
  portfolio/               PortfolioView, Hero, Projects, Career, Education (+ preview), PdfViewer, Modal, Contact, Section
  header/ footer/ backgroundblobs/ LanguageProvider.tsx
data/
  mock/content.mock.json           Mock content (ES/EN)
  mock/contact-messages.mock.json  Sample contact messages
  content.json                     Real content (only with CONTENT_SOURCE=file)
interfaces/content.ts      Domain types
lib/
  admin/session.ts         Config, credentials, session token (Web Crypto)
  admin/guard.ts           Session and CSRF checks in handlers
  admin/rate-limit.ts      Login attempt limiting
  content/repository.ts    Content data layer (mock | file)
  contact/service.ts       Contact service (mock) + validation
  storage/                 File storage (local | remote) and key helpers
  content/validation.ts    Content document validation
public/mock/               Sample images and PDFs
storage/diplomas/          Diplomas/certificates served by /api/diplomas
locales/                   Static UI strings (es.ts, en.ts)
proxy.ts                   Protects the secret route and /api/admin
docs/                      This documentation
```

## 4. Data model

Defined in `interfaces/content.ts`.

```ts
PortfolioContent {
  updatedAt: string                 // ISO, set by the server
  socialLinks: SocialLink[]         // shared across languages
  locales: { es: LocalizedContent; en: LocalizedContent }
}

LocalizedContent {
  profile: Profile
  projects: Project[]
  experience: Experience[]
  education: Education[]
}

Profile    { fullName, role, headline, about, stack: string[], location, email, avatarUrl?, cvUrl? }
Project    { id, name, shortDescription, fullDescription, technologies: TechItem[], screenshots: string[], githubUrl, demoUrl?, featured?, order? }
Experience { id, company, role, year, period, description, technologies: TechItem[], order? }
Education  { id, title, institution?, kind?, year?, period?, description?, diplomaPath?, diplomaUrl?, order? }
TechItem   { name, icon }
SocialLink { label, href, icon }
```

Validation rules (`lib/content/validation.ts`): required fields, length limits, `http(s)`/`mailto` URLs or internal `/…` paths, valid email, unique ids per list and a max number of items per list. `order` is recomputed from the item position in the panel.

There are two kinds of text:

- **Static UI strings** (buttons, section titles) → `locales/es.ts` and `locales/en.ts` (in code).
- **Editable content** (profile, projects, etc.) → data layer (`CONTENT_SOURCE`), editable from the panel.

## 5. Endpoints

All responses are JSON.

### `GET /api/content?locale=es|en` — public

Returns the content for one language (default `es`).

```json
{
  "profile": { "fullName": "Nicolas Selicki", "role": "Full Stack Developer", "...": "..." },
  "projects": [ ... ], "experience": [ ... ], "education": [ ... ],
  "socialLinks": [ ... ],
  "updatedAt": "2026-11-24T12:00:00.000Z"
}
```

| Status | Reason |
|---|---|
| 200 | OK |
| 400 | `locale` other than `es`/`en` |

### `POST /api/contact` — public

`multipart/form-data` with `fullName`, `email`, `message` and an optional `attachment` (PDF, JPG/JPEG, DOC/DOCX, max 5 MB). Includes an anti-spam honeypot (`website`).

| Status | Response |
|---|---|
| 201 | `{ "ok": true, "id": "msg-..." }` |
| 400 | `{ "errors": { "email": "invalid", "attachment": "invalid_type" } }` (`invalid`, `too_large`, `invalid_type`) |

Current source: **mock** — stores the message in memory, logs it to the server console and simulates 600 ms of latency.

### `GET /api/diplomas/:id?locale=es|en[&download=1]` — public

Serves an education entry's diploma/certificate from storage.

- Only files referenced in the content (`education[].diplomaPath`) are served: never arbitrary paths.
- Without `download` → `Content-Disposition: inline` (preview). With `download=1` → `attachment` (download with a readable name, e.g. `aws-cloud-practitioner.jpg`).
- If the entry only has a `diplomaUrl` (external URL), it redirects (302) there.

| Status | Reason |
|---|---|
| 200 | File (PDF, JPG, PNG or WEBP) |
| 302 | Redirect to external `diplomaUrl` |
| 400 | Invalid `locale` |
| 404 | Entry doesn't exist, has no diploma, or the file isn't in storage |

### `GET /api/admin/messages` — session required

Lists messages received since the server started (mock source).

### `POST /api/admin/login`

Body:

```json
{ "username": "nicolas", "password": "••••••••" }
```

| Status | Response |
|---|---|
| 200 | `{ "ok": true }` + `Set-Cookie: __portfolio_admin=…; HttpOnly; SameSite=Strict; Secure` |
| 400 | Invalid body |
| 401 | `{ "error": "Usuario o contraseña incorrectos" }` |
| 403 | Cross-site `Origin` |
| 404 | Panel disabled (missing `ADMIN_*` variables) |
| 429 | Too many attempts (5 per 15 min per IP). `Retry-After` header |

### `POST /api/admin/logout`

Clears the cookie. Responds `{ "ok": true }`.

### `GET /api/admin/content` — session required

Returns the full `PortfolioContent` (both languages). Without a session: **404**.

### `PUT /api/admin/content` — session required

Body: full `PortfolioContent` (replaces the document). `updatedAt` is set by the server.

| Status | Response |
|---|---|
| 200 | Saved (normalized) document |
| 400 | Invalid JSON |
| 403 | Cross-site `Origin` |
| 404 | No session |
| 413 | Body > 1 MB |
| 422 | `{ "errors": ["locales.es.profile.email: email inválido", ...] }` |
| 500 | File could not be written (see deployment) |

`curl` example:

```bash
curl -c cj -X POST http://localhost:3000/api/admin/login \
  -H 'Content-Type: application/json' -d '{"username":"nicolas","password":"..."}'
curl -b cj http://localhost:3000/api/admin/content > content.json
# edit content.json …
curl -b cj -X PUT http://localhost:3000/api/admin/content \
  -H 'Content-Type: application/json' --data @content.json
```

## 6. Routes

| Visible route | What it is | Access |
|---|---|---|
| `/` | Public home | Public |
| `/<ADMIN_SECRET_PATH>` | Panel login | Only whoever knows the slug. With a session it redirects to the panel |
| `/<ADMIN_SECRET_PATH>/panel` | Edit form | Valid session; otherwise redirects to login |
| `/admin`, `/admin/*` | Internal route | **Always 404** |
| `/api/content` | Public API | Public |
| `/api/admin/*` | Panel API | 404 without a session (except login/logout) |

## 7. Panel security (how private access works)

The chosen approach is **secret route + `.env` credentials + signed cookie**, with no user system:

1. **Configurable hidden route**: the slug comes from `ADMIN_SECRET_PATH` and is not in the code or the repository. `proxy.ts` internally rewrites `/<slug>` → `/admin`; requesting `/admin` directly returns 404.
2. **Server-side credentials**: `ADMIN_USERNAME` / `ADMIN_PASSWORD` are compared on the server in **constant time** (fixed-length HMACs are compared). They never reach the browser.
3. **Stateless session**: on login a `payload.signature` token is issued (HMAC-SHA256 with `ADMIN_SESSION_SECRET`) with an expiry (`ADMIN_SESSION_HOURS`, default 2 h), in an `HttpOnly`, `SameSite=Strict` cookie, `Secure` in production.
4. **Double check**: `proxy.ts` filters routes, and every panel page and endpoint verifies the session again (official Next.js guidance: don't rely on the proxy alone).
5. **The API is protected, not just the page**: `/api/admin/content` requires a session; without one it returns 404 so its existence isn't revealed.
6. **Brute-force protection**: 5 failed attempts per IP every 15 minutes (in memory).
7. **CSRF**: `SameSite=Strict` cookie + `Origin` header validation on mutating methods.
8. **Not indexable**: `X-Robots-Tag: noindex`, `robots` metadata, `Cache-Control: no-store`, `X-Frame-Options: DENY`.
9. **Fail-closed**: if any variable is missing or weak (slug < 8, password < 12, secret < 32 characters), the whole panel returns 404.

To invalidate every open session: change `ADMIN_SESSION_SECRET`.

Known limitations: rate limiting is per instance (not global on serverless); there is no 2FA. If more is needed later, the recommended option is to put the panel behind **Cloudflare Access** or the host's password protection, with no code changes.

## 8. Environment variables

See `.env.example`. Copy it to `.env.local`.

| Variable | Required | Description |
|---|---|---|
| `ADMIN_SECRET_PATH` | Yes (for the panel) | Secret route slug. Min. 8 chars `[A-Za-z0-9_-]` |
| `ADMIN_USERNAME` | Yes | Username |
| `ADMIN_PASSWORD` | Yes | Password, min. 12 characters |
| `ADMIN_SESSION_SECRET` | Yes | Signing key, min. 32 characters |
| `ADMIN_SESSION_HOURS` | No | Session length (default 2) |
| `CONTENT_SOURCE` | No | `mock` (default) or `file` |
| `CONTENT_FILE_PATH` | No | Content file with `file` (default `data/content.json`) |
| `STORAGE_SOURCE` | No | `local` (default) or `remote` |
| `STORAGE_LOCAL_DIR` | No | Local storage folder (default `storage`) |
| `STORAGE_BASE_URL` | With `remote` | Bucket/CDN base URL |

Generate secrets:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

## 9. Styling

- **Tailwind CSS 4** utility classes directly in components.
- **Design variables** in `app/globals.css`:
  - Background `#0a0a18` (`--background-rgb`), cream primary `#fffcdd` (`--primary-rgb`), yellow accent `#fef63e` (`--secondary-rgb`).
  - Borders `--color-border-rgba`, glow `--shadow-glow-rgba`.
- *Glassmorphism* look: translucent cards with `backdrop-blur` and animated background blobs (`BackgroundBlobs`).
- The panel reuses the same variables (see `components/admin/ui.tsx`).

## 10. Internationalization

- `LanguageProvider` holds the language (`es` by default) and persists it in `localStorage` (`portfolio-locale`).
- UI strings: `locales/*.ts`. Content: `locales.es` / `locales.en` in the content repository.

## 11. Mock data and data layer

### Included mocks

- `data/mock/content.mock.json`: content based on the real CV (profile, 5 experiences, 4 education entries, 4 personal projects and social links), in ES and EN.
- `public/mock/`: avatar and project screenshots (placeholder SVGs). Everything is local: the site works offline.
- `public/cv/`: Spanish and English CVs (PDF), linked from the "Download CV" button.
- `data/mock/contact-messages.mock.json`: contact payloads (2 valid, 1 invalid) for manual or automated tests.

### How they are consumed

```
app/page.tsx (server) ──► getContentRepository().getAll() ──► PortfolioView (client)
                                    │                                │
                         CONTENT_SOURCE=mock | file            picks the active locale
                                    │
                 data/mock/content.mock.json  |  data/content.json
```

- `CONTENT_SOURCE=mock` (default): reads the mock. Whatever is saved from the panel stays **in memory** (visible on the site immediately, lost on restart).
- `CONTENT_SOURCE=file`: reads/writes `CONTENT_FILE_PATH`; if it doesn't exist, it starts from the mock.
- The contact form uses `getContactService()`, currently always mock.

### Integrating a real service

1. Create a `ContentRepository` implementation (e.g. `createFirestoreRepository()`) with `getAll`, `getByLocale` and `save`.
2. Add the new value (`firestore`) to `ContentSource` and to the `switch` in `createRepository`.
3. Set `CONTENT_SOURCE=firestore` plus its credentials.
4. For contact, do the same with `ContactService.send/list` (e.g. Resend + Firestore).

The UI, the API and the panel stay the same.

## 12. Diplomas and storage

The **Professional education** section shows each entry as a card (type, title, institution) with two actions:

- **Preview**: opens a modal. PDFs are rendered with **pdf.js** (`pdfjs-dist`, loaded only when the modal opens) so they look the same on desktop, Android and iOS; images are shown directly. Includes "Download" and "Open in new tab".
- **Download**: link to `/api/diplomas/:id?download=1`, which forces the download even when the file lives on another domain.

Model: `education[].kind` (`degree`, `bootcamp`, `course`, `certification`) sets the label and icon; `diplomaPath` is the file key in storage (e.g. `diplomas/utn.pdf`) and takes precedence over `diplomaUrl`.

Storage (`lib/storage/`) is selected with `STORAGE_SOURCE`:

| Value | Where files come from |
|---|---|
| `local` (default) | `STORAGE_LOCAL_DIR` folder (default `storage/`). It holds the real diplomas; copies that contained an ID number (DNI) were redacted before publishing. Included in the build via `outputFileTracingIncludes`. |
| `remote` | `STORAGE_BASE_URL` + key, over HTTP (public GCS/S3 bucket, Firebase Storage, CDN). |

To move to real storage: upload the files with the same keys and set `STORAGE_SOURCE=remote` and `STORAGE_BASE_URL`. For a private bucket (signed URLs or an SDK), add a `FileStorage` implementation in `lib/storage/index.ts`; the endpoint and UI stay the same.

## 13. Local development

```bash
npm install
cp .env.example .env.local    # fill in values
npm run dev                   # http://localhost:3000
npm run lint
npm run build && npm start    # local production
```

Panel: `http://localhost:3000/<ADMIN_SECRET_PATH>`.

## 14. Deployment

### Option A — Node server with a disk (recommended for the current panel)

VPS, Railway, Render, Fly.io, Cloud Run with a volume, etc.

1. Set the environment variables from section 8.
2. `npm ci && npm run build && npm start` (port via `PORT`).
3. Make sure `data/` (or `CONTENT_FILE_PATH`) is on a **persistent volume** so changes survive deploys.
4. Serve behind HTTPS (required for the `Secure` cookie).

### Option B — Vercel (or other serverless)

With `CONTENT_SOURCE=mock` everything works (great for a demo), but panel changes don't persist across instances. With `file`, the **disk is read-only**: saving from the panel returns 500. Options:

- Replace the implementation in `lib/content/repository.ts` with a managed store (Firestore, Vercel Blob, Upstash/Redis, Supabase). The `ContentRepository` interface (`getAll`, `getByLocale`, `save`) is designed for that.
- Or edit locally and commit `data/content.json` (a "git-based" flow).

Either way, set the `ADMIN_*` variables in the host's environment settings.

## 15. Tests performed

Verified against a production build:

- Hidden routes → 404 (`/admin`, `/admin/panel`, `/api/admin/content` without a session, unknown sub-routes of the slug).
- Wrong login → 401; 6th attempt → 429.
- Correct login → `HttpOnly; SameSite=Strict; Secure` cookie; panel access.
- Invalid `PUT` → 422 with an error list; valid `PUT` → persisted and reflected in `GET /api/content`.
- Foreign `Origin` → 403. Tampered cookie → 404. Logout → 404 on the API.
- Browser flow (Playwright): login, edit profile, add project, save, log out.
- Home with mocks: hero, projects + modal, experience, education, contact and footer in ES/EN, desktop and mobile, no console errors.
- `POST /api/contact`: valid → 201, invalid fields → 400, PDF attachment → 201, `.exe` attachment → 400.
- Mock mode: a `PUT` from the panel shows up on the home page without writing files.
- Diplomas: `GET /api/diplomas/:id` inline and with `download=1` (PDF and JPG), 404/400; `../` path rejected by validation; pdf.js preview on desktop and mobile (Pixel 7) and download from the card and the modal.
