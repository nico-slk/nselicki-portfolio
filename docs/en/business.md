# Business documentation — Nicolas Selicki's Portfolio

> [Versión en español](../es/negocio.md) · [Technical documentation](./technical.md)

## 1. Purpose

This project is my **personal professional portfolio**: a bilingual (Spanish / English) website that gathers in one place who I am as a developer, where I have worked, what I have built and how to reach me.

Specific goals:

- **Present myself professionally** with a clear profile: role, stack, experience and education.
- **Showcase real work** through projects with descriptions, technologies, screenshots and links to code/demos.
- **Create opportunities** by making it easy for recruiters, companies and clients to contact me.
- **Keep it alive without friction**: a private panel lets me update content without touching code or redeploying for every text change.
- **Be a technical sample itself**: the portfolio's code is part of what I show (modern Next.js, TypeScript, a secured admin panel, documentation).

## 2. Target audience

| Audience | What they look for | How the site addresses it |
|---|---|---|
| **Recruiters / HR** | Quickly understand role, seniority and stack | Hero with role and stack, ordered experience, downloadable CV |
| **Tech leads / interviewers** | Assess technical quality | Projects with repos, technical descriptions, the portfolio's own code |
| **Freelance clients / companies** | Know whether I can solve their problem | Featured projects, contact form |
| **Community / peers** | Connect | Links to GitHub, LinkedIn and email |

Languages: Spanish (local market, Argentina/LatAm) and English (international and remote market).

## 3. MVP (Minimum Viable Product)

### In scope

1. **Bilingual public site** (ES/EN) with a persistent language toggle.
2. **Sections**: introduction (hero), projects, experience, education and contact.
3. **Content decoupled from code**: served from a swappable data layer (mocks today) and a read-only public API.
4. **Contact form** working against a mock service (validation, attachments and messages visible to the admin).
5. **Private admin panel** on a secret route, protected by a username and password stored in `.env`, to edit profile, projects, experience, education and social links in both languages.
6. **Mock data** to run and test the project without real services or information.
7. **Business and technical documentation** in both languages.

### Out of scope (next steps)

- Real service integrations: sending contact form emails and persistent storage for content and messages.
- File uploads (screenshots, CV, diplomas) from the panel.
- Managed database persistence (Firestore, Vercel Blob, etc.) for hosts without a writable disk.
- Visit analytics and advanced SEO (per-project Open Graph, sitemap).
- Light / dark mode.

### Success criteria

- A visitor understands my profile in under 30 seconds.
- I can update any text on the site in under 2 minutes without touching code.
- Nobody but me can access the panel or the write API.

## 4. Developer profile

**Nicolas Selicki — Semi-Senior Full Stack Developer** · Buenos Aires, Argentina

Full stack developer specialized in backend and scalable REST APIs (Node.js, Java/Spring Boot, microservices), with frontend experience in React, Angular and TypeScript. I currently work at **AGEA (Clarín Group)** on the **payments platform**: payment gateway (GWP), admin panel (GWP Admin) and card tokenization service (PCI). Previously at FactorIT (financial systems for BBVA), Kiura, freelance, and GlobalLogic (Banco Credicoop's banking platform).

What defines me as a developer:

- **Security by design**: experience with sensitive data (cards, transactions) and protection best practices.
- **Solid backend + modern frontend**: server-side services and APIs, plus interfaces built with React / Next.js and TypeScript.
- **End-to-end product mindset**: I care about understanding the business, not just the ticket.
- **Maintainable, documented code**: this repository is an example.

> The data shown on the site comes from the CV (`public/cv/`) and lives in `data/mock/content.mock.json` until a real service is integrated. It can be edited from the private panel.
