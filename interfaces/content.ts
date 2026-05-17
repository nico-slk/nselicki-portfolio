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

export interface Education {
    id: string;
    title: string;
    year: string;
    period: string;
    description?: string;
    diplomaPath?: string;
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
