import { isSafeKey } from "@/lib/storage/keys";
import type {
    Education,
    EducationKind,
    Experience,
    LocalizedContent,
    PortfolioContent,
    Profile,
    Project,
    SocialLink,
    TechItem
} from "@/interfaces/content";

/**
 * Validación manual (sin dependencias) del documento de contenido.
 * Devuelve el contenido normalizado o la lista de errores encontrados.
 */
export type ValidationResult =
    | { ok: true; value: PortfolioContent }
    | { ok: false; errors: string[] };

const LOCALES = ["es", "en"] as const;
const MAX_SHORT = 200;
const MAX_LONG = 5000;

type Obj = Record<string, unknown>;

class Collector {
    errors: string[] = [];
    add(path: string, msg: string) {
        if (this.errors.length < 50) this.errors.push(`${path}: ${msg}`);
    }
}

function isObj(v: unknown): v is Obj {
    return typeof v === "object" && v !== null && !Array.isArray(v);
}

function str(c: Collector, o: Obj, key: string, path: string, max = MAX_SHORT, required = true): string {
    const v = o[key];
    if (v === undefined || v === null || v === "") {
        if (required) c.add(`${path}.${key}`, "es obligatorio");
        return "";
    }
    if (typeof v !== "string") {
        c.add(`${path}.${key}`, "debe ser texto");
        return "";
    }
    const t = v.trim();
    if (t.length > max) c.add(`${path}.${key}`, `supera ${max} caracteres`);
    return t;
}

function optStr(c: Collector, o: Obj, key: string, path: string, max = MAX_SHORT): string | undefined {
    const v = str(c, o, key, path, max, false);
    return v === "" ? undefined : v;
}

function url(c: Collector, o: Obj, key: string, path: string, required: boolean): string | undefined {
    const v = required ? str(c, o, key, path, 500) : optStr(c, o, key, path, 500);
    if (!v) return undefined;
    // Se aceptan URLs absolutas http(s)/mailto o rutas internas ("/archivo.pdf").
    if (v.startsWith("/") && !v.startsWith("//")) return v;
    try {
        const u = new URL(v);
        if (!["http:", "https:", "mailto:"].includes(u.protocol)) {
            c.add(`${path}.${key}`, "protocolo no permitido");
        }
    } catch {
        c.add(`${path}.${key}`, "URL inválida");
    }
    return v;
}

function optNum(c: Collector, o: Obj, key: string, path: string): number | undefined {
    const v = o[key];
    if (v === undefined || v === null || v === "") return undefined;
    if (typeof v !== "number" || !Number.isFinite(v)) {
        c.add(`${path}.${key}`, "debe ser numérico");
        return undefined;
    }
    return v;
}

function arr(c: Collector, o: Obj, key: string, path: string, max = 100): unknown[] {
    const v = o[key];
    if (!Array.isArray(v)) {
        c.add(`${path}.${key}`, "debe ser una lista");
        return [];
    }
    if (v.length > max) c.add(`${path}.${key}`, `máximo ${max} elementos`);
    return v.slice(0, max);
}

function tech(c: Collector, v: unknown, path: string): TechItem | null {
    if (!isObj(v)) {
        c.add(path, "debe ser un objeto");
        return null;
    }
    return { name: str(c, v, "name", path, 60), icon: str(c, v, "icon", path, 60) };
}

function techList(c: Collector, o: Obj, key: string, path: string): TechItem[] {
    return arr(c, o, key, path, 40)
        .map((t, i) => tech(c, t, `${path}.${key}[${i}]`))
        .filter((t): t is TechItem => t !== null);
}

function uniqueIds(c: Collector, items: { id: string }[], path: string) {
    const seen = new Set<string>();
    items.forEach((it, i) => {
        if (seen.has(it.id)) c.add(`${path}[${i}].id`, `id duplicado "${it.id}"`);
        seen.add(it.id);
    });
}

function profile(c: Collector, v: unknown, path: string): Profile {
    const o = isObj(v) ? v : (c.add(path, "debe ser un objeto"), {});
    const stack = arr(c, o, "stack", path, 40).map((s, i) => {
        if (typeof s !== "string" || !s.trim()) c.add(`${path}.stack[${i}]`, "debe ser texto");
        return typeof s === "string" ? s.trim() : "";
    }).filter(Boolean);
    const email = str(c, o, "email", path, 200);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) c.add(`${path}.email`, "email inválido");
    return {
        fullName: str(c, o, "fullName", path),
        role: str(c, o, "role", path),
        headline: str(c, o, "headline", path, 300),
        about: str(c, o, "about", path, MAX_LONG),
        stack,
        location: str(c, o, "location", path),
        email,
        avatarUrl: url(c, o, "avatarUrl", path, false),
        cvUrl: url(c, o, "cvUrl", path, false)
    };
}

function project(c: Collector, v: unknown, path: string): Project {
    const o = isObj(v) ? v : (c.add(path, "debe ser un objeto"), {});
    const screenshots = arr(c, o, "screenshots", path, 20)
        .map((s, i) => url(c, { s }, "s", `${path}.screenshots[${i}]`, true))
        .filter((s): s is string => Boolean(s));
    return {
        id: str(c, o, "id", path, 80),
        name: str(c, o, "name", path),
        shortDescription: str(c, o, "shortDescription", path, 300),
        fullDescription: str(c, o, "fullDescription", path, MAX_LONG),
        technologies: techList(c, o, "technologies", path),
        screenshots,
        githubUrl: url(c, o, "githubUrl", path, true) ?? "",
        demoUrl: url(c, o, "demoUrl", path, false),
        featured: o.featured === true ? true : undefined,
        order: optNum(c, o, "order", path)
    };
}

function experience(c: Collector, v: unknown, path: string): Experience {
    const o = isObj(v) ? v : (c.add(path, "debe ser un objeto"), {});
    return {
        id: str(c, o, "id", path, 80),
        company: str(c, o, "company", path),
        role: str(c, o, "role", path),
        year: str(c, o, "year", path, 20),
        period: str(c, o, "period", path, 60),
        description: str(c, o, "description", path, MAX_LONG),
        technologies: techList(c, o, "technologies", path),
        order: optNum(c, o, "order", path)
    };
}

function education(c: Collector, v: unknown, path: string): Education {
    const o = isObj(v) ? v : (c.add(path, "debe ser un objeto"), {});
    return {
        id: str(c, o, "id", path, 80),
        title: str(c, o, "title", path),
        institution: optStr(c, o, "institution", path),
        kind: educationKind(c, o, path),
        year: optStr(c, o, "year", path, 20),
        period: optStr(c, o, "period", path, 60),
        description: optStr(c, o, "description", path, MAX_LONG),
        diplomaPath: storageKey(c, o, "diplomaPath", path),
        diplomaUrl: url(c, o, "diplomaUrl", path, false),
        order: optNum(c, o, "order", path)
    };
}

const EDUCATION_KINDS: EducationKind[] = ["degree", "bootcamp", "course", "certification"];

function educationKind(c: Collector, o: Obj, path: string): EducationKind | undefined {
    const v = optStr(c, o, "kind", path, 20);
    if (v === undefined) return undefined;
    if (!EDUCATION_KINDS.includes(v as EducationKind)) {
        c.add(`${path}.kind`, `debe ser uno de: ${EDUCATION_KINDS.join(", ")}`);
        return undefined;
    }
    return v as EducationKind;
}

function storageKey(c: Collector, o: Obj, key: string, path: string): string | undefined {
    const v = optStr(c, o, key, path, 300);
    if (v !== undefined && !isSafeKey(v)) c.add(`${path}.${key}`, "ruta de storage inválida (ej. diplomas/archivo.pdf)");
    return v;
}

function social(c: Collector, v: unknown, path: string): SocialLink {
    const o = isObj(v) ? v : (c.add(path, "debe ser un objeto"), {});
    return {
        label: str(c, o, "label", path, 60),
        href: url(c, o, "href", path, true) ?? "",
        icon: str(c, o, "icon", path, 60)
    };
}

function localized(c: Collector, v: unknown, path: string): LocalizedContent {
    const o = isObj(v) ? v : (c.add(path, "debe ser un objeto"), {});
    const projects = arr(c, o, "projects", path).map((p, i) => project(c, p, `${path}.projects[${i}]`));
    const exp = arr(c, o, "experience", path).map((p, i) => experience(c, p, `${path}.experience[${i}]`));
    const edu = arr(c, o, "education", path).map((p, i) => education(c, p, `${path}.education[${i}]`));
    uniqueIds(c, projects, `${path}.projects`);
    uniqueIds(c, exp, `${path}.experience`);
    uniqueIds(c, edu, `${path}.education`);
    return { profile: profile(c, o.profile, `${path}.profile`), projects, experience: exp, education: edu };
}

/** Elimina claves con valor undefined para que el JSON quede limpio. */
function clean<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
}

export function validatePortfolioContent(input: unknown): ValidationResult {
    const c = new Collector();
    if (!isObj(input)) return { ok: false, errors: ["El cuerpo debe ser un objeto JSON"] };

    const socialLinks = arr(c, input, "socialLinks", "socialLinks", 20).map((s, i) =>
        social(c, s, `socialLinks[${i}]`)
    );
    const rawLocales = isObj(input.locales) ? input.locales : (c.add("locales", "debe ser un objeto"), {});
    const locales = {} as PortfolioContent["locales"];
    for (const l of LOCALES) locales[l] = localized(c, rawLocales[l], `locales.${l}`);

    if (c.errors.length) return { ok: false, errors: c.errors };
    return { ok: true, value: clean({ updatedAt: new Date().toISOString(), socialLinks, locales }) };
}
