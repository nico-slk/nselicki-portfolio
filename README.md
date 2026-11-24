# Nicolas Selicki — Portfolio

> 🇦🇷 Español · [🇬🇧 English below](#english)

¡Hola! 👋 Bienvenido/a al repositorio de mi portfolio personal.

Soy **Nicolas Selicki**, desarrollador full stack con foco en backend. Trabajo en la plataforma de pagos de AGEA (Grupo Clarín) y este sitio reúne quién soy, en qué trabajé, qué construí y cómo contactarme, en **español e inglés**.

Además de ser mi carta de presentación, el proyecto en sí es una muestra técnica: está hecho con **Next.js 16, React 19, TypeScript y Tailwind CSS 4**, separa el contenido del código y tiene un **panel privado** para editar todo sin tocar una línea de código.

## ¿Qué vas a encontrar acá?

- 🌐 **Sitio público bilingüe**: perfil, proyectos, experiencia, formación y contacto.
- 🗂️ **Contenido desacoplado**: todo el contenido sale de un JSON validado y se expone por `GET /api/content`.
- 🔒 **Panel de administración oculto**: ruta secreta + usuario/contraseña del `.env` + cookie firmada. Solo el dueño puede entrar.
- 🧪 **Funciona 100% con datos mock**: el sitio, la API y el formulario de contacto consumen `data/mock/` y `public/mock/`, sin servicios externos. La fuente se cambia con `CONTENT_SOURCE`.
- 📚 **Documentación** de negocio y técnica en ES/EN (`docs/`).

## Probalo en 1 minuto

```bash
npm install
cp .env.example .env.local   # completá ADMIN_* con tus valores
npm run dev
```

- Sitio: <http://localhost:3000>
- API pública: <http://localhost:3000/api/content?locale=es>
- Panel: `http://localhost:3000/<ADMIN_SECRET_PATH>` (el valor que pusiste en `.env.local`)

Por defecto (`CONTENT_SOURCE=mock`) el sitio carga los datos mock y lo que edites en el panel queda en memoria hasta reiniciar. Con `CONTENT_SOURCE=file` los cambios se guardan en `data/content.json`.

## Documentación

| | Español | English |
|---|---|---|
| Negocio — finalidad, público, MVP, perfil | [negocio.md](docs/es/negocio.md) | [business.md](docs/en/business.md) |
| Técnica — stack, endpoints, rutas, seguridad, despliegue | [tecnica.md](docs/es/tecnica.md) | [technical.md](docs/en/technical.md) |

## Estructura rápida

```
app/          páginas, API (route handlers) y panel interno
components/   UI pública y del panel
data/mock/    datos de prueba (contenido y mensajes)
public/mock/  imágenes de prueba
storage/      diplomas y certificados (storage local; DNI removido en las copias públicas)
lib/          capa de datos (mock | file), storage de archivos, servicio de contacto, sesión admin
locales/      textos fijos de la UI (es / en)
proxy.ts      protección de la ruta secreta y de /api/admin
docs/         documentación ES / EN
```

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm start` | Sirve el build |
| `npm run lint` | ESLint |

---

<a id="english"></a>

## 🇬🇧 English

Hi! 👋 Welcome to my personal portfolio repository.

I'm **Nicolas Selicki**, a full stack developer with a backend focus. I work on the payments platform at AGEA (Clarín Group), and this site brings together who I am, where I've worked, what I've built and how to reach me — in **Spanish and English**.

Beyond being my introduction, the project itself is a technical sample: it's built with **Next.js 16, React 19, TypeScript and Tailwind CSS 4**, keeps content separate from code, and includes a **private panel** to edit everything without touching code.

**Highlights:** bilingual public site running 100% on mock data (`CONTENT_SOURCE=mock`) · validated content exposed via `GET /api/content` · mock contact form · hidden admin panel (secret route + `.env` credentials + signed cookie) · ready-to-use mock data · ES/EN business and technical docs.

**Quick start:** `npm install` → `cp .env.example .env.local` (fill in `ADMIN_*`) → `npm run dev` → open <http://localhost:3000>. The panel lives at `/<ADMIN_SECRET_PATH>`.

**Docs:** [Business](docs/en/business.md) · [Technical](docs/en/technical.md)
