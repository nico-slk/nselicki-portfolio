export type Locale = "es" | "en";

export interface TechItem {
    name: string;
    icon: string;
}

export interface Project {
    id: string;
    name: string;
    shortDescription: string;
    fullDescription: string;
    technologies: TechItem[];
    screenshots: string[];
    githubUrl: string;
    demoUrl?: string;
    featured?: boolean;
    order?: number;
}

export type EducationKind = "degree" | "bootcamp" | "course" | "certification";

export interface Education {
    id: string;
    title: string;
    institution?: string;
    kind?: EducationKind;
    year?: string;
    period?: string;
    description?: string;
    /** Clave del archivo en Firebase Storage (ej. "diplomas/utn.pdf"). */
    diplomaPath?: string;
    /** URL externa alternativa (si el archivo no está en nuestro storage). */
    diplomaUrl?: string;
    order?: number;
}

export interface Experience {
    id: string;
    company: string;
    role: string;
    year: string;
    period: string;
    description: string;
    technologies: TechItem[];
    order?: number;
}

export interface ContactPayload {
    fullName: string;
    email: string;
    message: string;
    attachmentUrl?: string;
    attachmentName?: string;
}

export interface SocialLink {
    label: string;
    href: string;
    icon: string;
}

/** Datos personales que se muestran en el hero / "sobre mí". */
export interface Profile {
    fullName: string;
    role: string;
    headline: string;
    about: string;
    stack: string[];
    location: string;
    email: string;
    avatarUrl?: string;
    cvUrl?: string;
}

/** Todo el contenido editable de un idioma. */
export interface LocalizedContent {
    profile: Profile;
    projects: Project[];
    experience: Experience[];
    education: Education[];
}

/** Documento completo que persiste el repositorio de contenido. */
export interface PortfolioContent {
    updatedAt: string;
    socialLinks: SocialLink[];
    locales: Record<Locale, LocalizedContent>;
}
