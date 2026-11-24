# Documentación técnica — Portfolio de Nicolas Selicki

> [English version](../en/technical.md) · [Documentación de negocio](./negocio.md)

## 1. Contexto

Aplicación web **Next.js (App Router)** que sirve un portfolio bilingüe y un panel privado para editar su contenido. No hay base de datos ni sistema de usuarios: el contenido sale de una **capa de datos intercambiable** (hoy mocks o un archivo JSON) y el acceso al panel se controla con credenciales del `.env` y una cookie firmada.

**Estado actual: todo funciona con datos mock.** La home, la API y el formulario de contacto consumen `data/mock/` sin depender de ningún servicio externo. La integración con servicios reales se hace implementando las interfaces de `lib/content/repository.ts` y `lib/contact/service.ts`, sin tocar la UI.

> ⚠️ Esta versión de Next.js (16) tiene cambios importantes respecto de versiones anteriores (por ejemplo `middleware` pasó a llamarse **`proxy`**). Ante dudas consultar `node_modules/next/dist/docs/` (ver `AGENTS.md`).

## 2. Stack y lenguaje

| Capa | Tecnología |
|---|---|
| Lenguaje | **TypeScript 5** (modo `strict`) |
| Framework | **Next.js 16.2** (App Router, Route Handlers, Proxy) con Turbopack |
| UI | **React 19.2** |
| Estilos | **Tailwind CSS 4** (vía `@tailwindcss/postcss`) + variables CSS en `app/globals.css` |
| Tipografías | Geist / Geist Mono (`next/font/google`) |
| Calidad | ESLint 9 (`eslint-config-next`) |
| Seguridad | Web Crypto API (HMAC-SHA256) — sin dependencias externas |
| Runtime | Node.js ≥ 20 |

## 3. Estructura del proyecto

```
app/
  layout.tsx               Layout raíz (fuentes, fondo animado, LanguageProvider)
  page.tsx                 Home pública (lee el contenido en el servidor)
  globals.css              Tailwind + variables de diseño
  admin/                   Panel (ruta INTERNA, nunca accesible directo)
    layout.tsx             metadata noindex
    page.tsx               Login
    panel/page.tsx         Formulario de edición
  api/
    content/route.ts       GET público
    contact/route.ts       POST formulario de contacto (mock)
    diplomas/[id]/route.ts GET diploma (inline o descarga)
    admin/login/route.ts   POST login
    admin/logout/route.ts  POST logout
    admin/content/route.ts GET / PUT contenido (protegido)
    admin/messages/route.ts GET mensajes de contacto recibidos (protegido)
components/
  admin/                   LoginForm, ContentEditor, ui (campos y listas)
  portfolio/               PortfolioView, Hero, Projects, Career, Education (+ vista previa), PdfViewer, Modal, Contact, Section
  header/ footer/ backgroundblobs/ LanguageProvider.tsx
data/
  mock/content.mock.json           Contenido mock (ES/EN)
  mock/contact-messages.mock.json  Mensajes de contacto de prueba
  content.json                     Contenido real (solo con CONTENT_SOURCE=file)
interfaces/content.ts      Tipos del dominio
lib/
  admin/session.ts         Config, credenciales, token de sesión (Web Crypto)
  admin/guard.ts           Verificación de sesión y CSRF en handlers
  admin/rate-limit.ts      Límite de intentos de login
  content/repository.ts    Capa de datos del contenido (mock | file)
  contact/service.ts       Servicio de contacto (mock) + validaciones
  storage/                 Storage de archivos (local | remote) y utilidades de claves
  content/validation.ts    Validación del documento de contenido
public/mock/               Imágenes y PDFs de ejemplo
storage/diplomas/          Diplomas y certificados servidos por /api/diplomas
locales/                   Textos fijos de la UI (es.ts, en.ts)
proxy.ts                   Protección de la ruta secreta y de /api/admin
docs/                      Esta documentación
```

## 4. Modelo de datos

Definido en `interfaces/content.ts`.

```ts
PortfolioContent {
  updatedAt: string                 // ISO, lo asigna el servidor
  socialLinks: SocialLink[]         // compartido entre idiomas
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

Reglas de validación (`lib/content/validation.ts`): campos obligatorios, límites de longitud, URLs `http(s)`/`mailto` o rutas internas `/…`, email válido, ids únicos por lista y máximo de elementos por lista. `order` se recalcula según la posición en el panel.

Hay dos tipos de texto:

- **Textos fijos de la UI** (botones, títulos de secciones) → `locales/es.ts` y `locales/en.ts` (en código).
- **Contenido editable** (perfil, proyectos, etc.) → capa de datos (`CONTENT_SOURCE`), editable desde el panel.

## 5. Endpoints

Todas las respuestas son JSON.

### `GET /api/content?locale=es|en` — público

Devuelve el contenido de un idioma (por defecto `es`).

```json
{
  "profile": { "fullName": "Nicolas Selicki", "role": "Full Stack Developer", "...": "..." },
  "projects": [ ... ], "experience": [ ... ], "education": [ ... ],
  "socialLinks": [ ... ],
  "updatedAt": "2026-11-24T12:00:00.000Z"
}
```

| Código | Motivo |
|---|---|
| 200 | OK |
| 400 | `locale` distinto de `es`/`en` |

### `POST /api/contact` — público

`multipart/form-data` con `fullName`, `email`, `message` y `attachment` opcional (PDF, JPG/JPEG, DOC/DOCX, máx. 5 MB). Incluye un honeypot anti-spam (`website`).

| Código | Respuesta |
|---|---|
| 201 | `{ "ok": true, "id": "msg-..." }` |
| 400 | `{ "errors": { "email": "invalid", "attachment": "invalid_type" } }` (`invalid`, `too_large`, `invalid_type`) |

Fuente actual: **mock** — guarda el mensaje en memoria, lo imprime en la consola del servidor y simula 600 ms de latencia.

### `GET /api/diplomas/:id?locale=es|en[&download=1]` — público

Sirve el diploma/certificado de una formación desde el storage.

- Solo entrega archivos referenciados en el contenido (`education[].diplomaPath`): nunca rutas arbitrarias.
- Sin `download` → `Content-Disposition: inline` (vista previa). Con `download=1` → `attachment` (descarga con nombre legible, ej. `aws-cloud-practitioner.jpg`).
- Si la formación solo tiene `diplomaUrl` (URL externa), redirige (302) a esa URL.

| Código | Motivo |
|---|---|
| 200 | Archivo (PDF, JPG, PNG o WEBP) |
| 302 | Redirección a `diplomaUrl` externa |
| 400 | `locale` inválido |
| 404 | La formación no existe, no tiene diploma o el archivo no está en el storage |

### `GET /api/admin/messages` — requiere sesión

Lista los mensajes recibidos desde que arrancó el servidor (fuente mock).

### `POST /api/admin/login`

Body:

```json
{ "username": "nicolas", "password": "••••••••" }
```

| Código | Respuesta |
|---|---|
| 200 | `{ "ok": true }` + `Set-Cookie: __portfolio_admin=…; HttpOnly; SameSite=Strict; Secure` |
| 400 | Body inválido |
| 401 | `{ "error": "Usuario o contraseña incorrectos" }` |
| 403 | `Origin` de otro sitio |
| 404 | Panel deshabilitado (faltan variables `ADMIN_*`) |
| 429 | Demasiados intentos (5 cada 15 min por IP). Header `Retry-After` |

### `POST /api/admin/logout`

Borra la cookie. Responde `{ "ok": true }`.

### `GET /api/admin/content` — requiere sesión

Devuelve el `PortfolioContent` completo (ambos idiomas). Sin sesión: **404**.

### `PUT /api/admin/content` — requiere sesión

Body: `PortfolioContent` completo (reemplaza el documento). `updatedAt` lo pone el servidor.

| Código | Respuesta |
|---|---|
| 200 | Documento guardado (normalizado) |
| 400 | JSON inválido |
| 403 | `Origin` de otro sitio |
| 404 | Sin sesión |
| 413 | Body > 1 MB |
| 422 | `{ "errors": ["locales.es.profile.email: email inválido", ...] }` |
| 500 | No se pudo escribir el archivo (ver despliegue) |

Ejemplo con `curl`:

```bash
curl -c cj -X POST http://localhost:3000/api/admin/login \
  -H 'Content-Type: application/json' -d '{"username":"nicolas","password":"..."}'
curl -b cj http://localhost:3000/api/admin/content > content.json
# editar content.json …
curl -b cj -X PUT http://localhost:3000/api/admin/content \
  -H 'Content-Type: application/json' --data @content.json
```

## 6. Rutas

| Ruta visible | Qué es | Acceso |
|---|---|---|
| `/` | Home pública | Público |
| `/<ADMIN_SECRET_PATH>` | Login del panel | Solo quien conoce el slug. Con sesión redirige al panel |
| `/<ADMIN_SECRET_PATH>/panel` | Formulario de edición | Sesión válida; si no, redirige al login |
| `/admin`, `/admin/*` | Ruta interna | **Siempre 404** |
| `/api/content` | API pública | Público |
| `/api/admin/*` | API del panel | 404 sin sesión (salvo login/logout) |

## 7. Seguridad del panel (cómo funciona el acceso privado)

Se eligió **ruta secreta + credenciales en `.env` + cookie firmada**, sin sistema de usuarios:

1. **Ruta oculta configurable**: el slug sale de `ADMIN_SECRET_PATH` y no está en el código ni en el repositorio. `proxy.ts` reescribe `/<slug>` → `/admin` internamente; acceder a `/admin` directamente da 404.
2. **Credenciales en el servidor**: `ADMIN_USERNAME` / `ADMIN_PASSWORD` se comparan en el servidor en **tiempo constante** (se comparan HMACs de longitud fija). Nunca llegan al navegador.
3. **Sesión sin estado**: al loguearse se emite un token `payload.firma` (HMAC-SHA256 con `ADMIN_SESSION_SECRET`) con expiración (`ADMIN_SESSION_HOURS`, por defecto 2 h), en una cookie `HttpOnly`, `SameSite=Strict`, `Secure` en producción.
4. **Doble verificación**: `proxy.ts` filtra las rutas, y además cada página y endpoint del panel vuelve a verificar la sesión (recomendación oficial de Next.js: no depender solo del proxy).
5. **Protección de la API, no solo de la página**: `/api/admin/content` exige sesión; sin ella responde 404 para no revelar que existe.
6. **Anti fuerza bruta**: 5 intentos fallidos por IP cada 15 minutos (en memoria).
7. **CSRF**: cookie `SameSite=Strict` + validación del header `Origin` en métodos que modifican.
8. **No indexable**: `X-Robots-Tag: noindex`, `robots` en metadata, `Cache-Control: no-store`, `X-Frame-Options: DENY`.
9. **Fail-closed**: si falta alguna variable o es débil (slug < 8, contraseña < 12, secreto < 32 caracteres), el panel entero responde 404.

Para invalidar todas las sesiones abiertas: cambiar `ADMIN_SESSION_SECRET`.

Limitaciones conocidas: el rate limit es por instancia (en serverless no es global); no hay 2FA. Si en el futuro hace falta más, la opción recomendada es poner el panel detrás de **Cloudflare Access** o la protección por contraseña del hosting, sin cambiar el código.

## 8. Variables de entorno

Ver `.env.example`. Copiar como `.env.local`.

| Variable | Obligatoria | Descripción |
|---|---|---|
| `ADMIN_SECRET_PATH` | Sí (para el panel) | Slug de la ruta secreta. Mín. 8 caracteres `[A-Za-z0-9_-]` |
| `ADMIN_USERNAME` | Sí | Usuario |
| `ADMIN_PASSWORD` | Sí | Contraseña, mín. 12 caracteres |
| `ADMIN_SESSION_SECRET` | Sí | Clave de firma, mín. 32 caracteres |
| `ADMIN_SESSION_HOURS` | No | Duración de la sesión (def. 2) |
| `CONTENT_SOURCE` | No | `mock` (def.) o `file` |
| `CONTENT_FILE_PATH` | No | Archivo de contenido con `file` (def. `data/content.json`) |
| `STORAGE_SOURCE` | No | `local` (def.) o `remote` |
| `STORAGE_LOCAL_DIR` | No | Carpeta del storage local (def. `storage`) |
| `STORAGE_BASE_URL` | Con `remote` | URL base del bucket/CDN |

Generar secretos:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

## 9. Estilos

- **Tailwind CSS 4** con clases utilitarias directamente en los componentes.
- **Variables de diseño** en `app/globals.css`:
  - Fondo `#0a0a18` (`--background-rgb`), primario crema `#fffcdd` (`--primary-rgb`), acento amarillo `#fef63e` (`--secondary-rgb`).
  - Bordes `--color-border-rgba`, brillo `--shadow-glow-rgba`.
- Estética *glassmorphism*: tarjetas semitransparentes con `backdrop-blur` y blobs animados de fondo (`BackgroundBlobs`).
- El panel reutiliza las mismas variables (ver `components/admin/ui.tsx`).

## 10. Internacionalización

- `LanguageProvider` mantiene el idioma (`es` por defecto) y lo persiste en `localStorage` (`portfolio-locale`).
- Textos de UI: `locales/*.ts`. Contenido: `locales.es` / `locales.en` del repositorio de contenido.

## 11. Datos mock y capa de datos

### Mocks incluidos

- `data/mock/content.mock.json`: contenido basado en el CV real (perfil, 5 experiencias, 4 formaciones, 4 proyectos personales y redes), en ES y EN.
- `public/mock/`: avatar y capturas de proyectos (SVG placeholder). Todo es local: el sitio funciona sin internet.
- `public/cv/`: CV en español e inglés (PDF), enlazados desde el botón "Descargar CV".
- `data/mock/contact-messages.mock.json`: payloads de contacto (2 válidos y 1 inválido) para pruebas manuales o automatizadas.

### Cómo se consumen

```
app/page.tsx (server) ──► getContentRepository().getAll() ──► PortfolioView (client)
                                    │                                │
                         CONTENT_SOURCE=mock | file           elige el idioma activo
                                    │
                 data/mock/content.mock.json  |  data/content.json
```

- `CONTENT_SOURCE=mock` (por defecto): lee el mock. Lo que se guarda desde el panel queda **en memoria** (se ve en el sitio al instante y se pierde al reiniciar).
- `CONTENT_SOURCE=file`: lee/escribe `CONTENT_FILE_PATH`; si no existe, arranca desde el mock.
- El formulario de contacto usa `getContactService()`, hoy siempre mock.

### Cómo integrar un servicio real

1. Crear una implementación de `ContentRepository` (por ejemplo `createFirestoreRepository()`) con `getAll`, `getByLocale` y `save`.
2. Agregar el nuevo valor (`firestore`) a `ContentSource` y al `switch` de `createRepository`.
3. Configurar `CONTENT_SOURCE=firestore` y sus credenciales.
4. Para contacto, lo mismo con `ContactService.send/list` (por ejemplo Resend + Firestore).

La UI, la API y el panel no cambian.

## 12. Diplomas y storage

La sección **Formación profesional** muestra cada formación como una tarjeta (tipo, título, institución) con dos acciones:

- **Vista previa**: abre un modal. Los PDF se renderizan con **pdf.js** (`pdfjs-dist`, cargado solo al abrir el modal) para que se vean igual en desktop, Android e iOS; las imágenes se muestran directamente. Incluye "Descargar" y "Abrir en pestaña nueva".
- **Descargar**: link a `/api/diplomas/:id?download=1`, que fuerza la descarga incluso si el archivo viene de otro dominio.

Modelo: `education[].kind` (`degree`, `bootcamp`, `course`, `certification`) define la etiqueta y el ícono; `diplomaPath` es la clave del archivo en el storage (ej. `diplomas/utn.pdf`) y tiene prioridad sobre `diplomaUrl`.

El storage (`lib/storage/`) se elige con `STORAGE_SOURCE`:

| Valor | Origen de los archivos |
|---|---|
| `local` (def.) | Carpeta `STORAGE_LOCAL_DIR` (def. `storage/`). Contiene los diplomas reales; las copias que mostraban el DNI se publicaron con ese dato eliminado. Se incluye en el build con `outputFileTracingIncludes`. |
| `remote` | `STORAGE_BASE_URL` + clave, por HTTP (bucket público de GCS/S3, Firebase Storage, CDN). |

Para pasar a un storage real: subir los archivos con la misma clave, configurar `STORAGE_SOURCE=remote` y `STORAGE_BASE_URL`. Para un bucket privado (URLs firmadas o SDK), agregar una implementación de `FileStorage` en `lib/storage/index.ts`; el endpoint y la UI no cambian.

## 13. Desarrollo local

```bash
npm install
cp .env.example .env.local    # completar valores
npm run dev                   # http://localhost:3000
npm run lint
npm run build && npm start    # producción local
```

Panel: `http://localhost:3000/<ADMIN_SECRET_PATH>`.

## 14. Despliegue

### Opción A — Servidor Node con disco (recomendada para el panel actual)

VPS, Railway, Render, Fly.io, Cloud Run con volumen, etc.

1. Configurar las variables de entorno del punto 8.
2. `npm ci && npm run build && npm start` (puerto por `PORT`).
3. Asegurar que `data/` (o `CONTENT_FILE_PATH`) esté en un **volumen persistente** para no perder cambios en cada deploy.
4. Servir detrás de HTTPS (necesario para la cookie `Secure`).

### Opción B — Vercel (u otro serverless)

Con `CONTENT_SOURCE=mock` todo funciona (ideal para una demo), pero los cambios del panel no persisten entre instancias. Con `file`, el **disco es de solo lectura**: guardar desde el panel devuelve 500. Opciones:

- Reemplazar la implementación de `lib/content/repository.ts` por un store administrado (Firestore, Vercel Blob, Upstash/Redis, Supabase). La interfaz `ContentRepository` (`getAll`, `getByLocale`, `save`) está pensada para eso.
- O editar en local y commitear `data/content.json` (flujo "git-based").

En ambos casos, cargar las variables `ADMIN_*` en la configuración de entorno del hosting.

## 15. Pruebas realizadas

Verificado con build de producción:

- Rutas ocultas → 404 (`/admin`, `/admin/panel`, `/api/admin/content` sin sesión, subrutas desconocidas del slug).
- Login incorrecto → 401; 6.º intento → 429.
- Login correcto → cookie `HttpOnly; SameSite=Strict; Secure`; acceso al panel.
- `PUT` inválido → 422 con lista de errores; `PUT` válido → persiste y se refleja en `GET /api/content`.
- `Origin` ajeno → 403. Cookie adulterada → 404. Logout → 404 en la API.
- Flujo en navegador (Playwright): login, editar perfil, agregar proyecto, guardar, cerrar sesión.
- Home con mocks: hero, proyectos + modal, experiencia, formación, contacto y footer en ES/EN, desktop y móvil, sin errores de consola.
- `POST /api/contact`: válido → 201, campos inválidos → 400, adjunto PDF → 201, adjunto `.exe` → 400.
- Modo mock: un `PUT` desde el panel se refleja en la home sin escribir archivos.
- Diplomas: `GET /api/diplomas/:id` inline y con `download=1` (PDF y JPG), 404/400; ruta `../` rechazada por validación; vista previa con pdf.js en desktop y móvil (Pixel 7) y descarga desde la tarjeta y el modal.
