# Documentación de negocio — Portfolio de Nicolas Selicki

> [English version](../en/business.md) · [Documentación técnica](./tecnica.md)

## 1. Finalidad del proyecto

Este proyecto es mi **portfolio profesional personal**: un sitio web bilingüe (español / inglés) que reúne en un solo lugar quién soy como desarrollador, en qué trabajé, qué construí y cómo contactarme.

Objetivos concretos:

- **Presentarme profesionalmente** con un perfil claro: rol, stack, experiencia y formación.
- **Mostrar trabajo real** mediante proyectos con descripción, tecnologías, capturas y enlaces a código/demos.
- **Generar oportunidades**: facilitar que reclutadores, empresas o clientes me contacten.
- **Mantenerlo vivo sin fricción**: un panel privado me permite actualizar el contenido sin tocar código ni hacer un nuevo despliegue para cada cambio de texto.
- **Ser en sí mismo una muestra técnica**: el código del portfolio es parte de lo que muestro (Next.js moderno, TypeScript, seguridad del panel, documentación).

## 2. Público objetivo

| Público | Qué busca | Cómo lo resuelve el sitio |
|---|---|---|
| **Reclutadores / RR. HH.** | Entender rápido rol, seniority y stack | Hero con rol y stack, experiencia ordenada, CV descargable |
| **Líderes técnicos / entrevistadores** | Evaluar calidad técnica | Proyectos con repos, descripción técnica, el propio código del portfolio |
| **Clientes freelance / empresas** | Saber si puedo resolver su problema | Proyectos destacados, formulario de contacto |
| **Comunidad / colegas** | Conectar | Enlaces a GitHub, LinkedIn y email |

Idiomas: español (mercado local, Argentina/LatAm) e inglés (mercado internacional y remoto).

## 3. MVP (Producto Mínimo Viable)

### Incluido en el MVP

1. **Sitio público bilingüe** (ES/EN) con selector de idioma persistente.
2. **Secciones**: presentación (hero), proyectos, experiencia, formación y contacto.
3. **Contenido desacoplado del código**: se sirve desde una capa de datos intercambiable (hoy mocks) y una API pública de solo lectura.
4. **Formulario de contacto** funcionando contra un servicio mock (validación, adjuntos y mensajes visibles para el admin).
5. **Panel de administración privado** en una ruta secreta, protegido con usuario y contraseña definidos en el `.env`, para editar perfil, proyectos, experiencia, formación y redes en ambos idiomas.
6. **Datos mock** para levantar el proyecto y probarlo sin depender de servicios ni información real.
7. **Documentación** de negocio y técnica en ambos idiomas.

### Fuera del MVP (siguientes pasos)

- Integración con servicios reales: envío de emails del formulario y almacenamiento persistente de contenido y mensajes.
- Subida de archivos (capturas, CV, diplomas) desde el panel.
- Persistencia en base de datos administrada (Firestore, Vercel Blob, etc.) para hostings sin disco escribible.
- Analítica de visitas y SEO avanzado (Open Graph por proyecto, sitemap).
- Modo claro / oscuro.

### Criterios de éxito

- Un visitante entiende mi perfil en menos de 30 segundos.
- Puedo actualizar cualquier texto del sitio en menos de 2 minutos sin tocar código.
- Nadie más que yo puede acceder al panel ni a la API de escritura.

## 4. Perfil del desarrollador

**Nicolás Selicki — Full Stack Developer Semi-Senior** · Buenos Aires, Argentina

Desarrollador full stack especializado en backend y APIs REST escalables (Node.js, Java/Spring Boot, microservicios), con experiencia en frontend con React, Angular y TypeScript. Actualmente trabajo en **AGEA (Grupo Clarín)** dentro de la **plataforma de pagos**: gateway de pagos (GWP), panel de administración (GWP Admin) y servicio de tokenización de tarjetas (PCI). Antes trabajé en FactorIT (sistemas financieros para BBVA), Kiura, como freelance y en GlobalLogic (plataforma bancaria de Banco Credicoop).

Lo que me define como desarrollador:

- **Seguridad desde el diseño**: experiencia con datos sensibles (tarjetas, transacciones) y buenas prácticas de protección.
- **Backend sólido + frontend moderno**: servicios y APIs del lado servidor, e interfaces con React / Next.js y TypeScript.
- **Producto de punta a punta**: me interesa entender el negocio, no solo el ticket.
- **Código mantenible y documentado**: este mismo repositorio es un ejemplo.

> Los datos que muestra el sitio salen del CV (`public/cv/`) y viven en `data/mock/content.mock.json` hasta integrar un servicio real. Se pueden editar desde el panel privado.
