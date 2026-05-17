export const sectionIds = ["contact", "projects", "education", "experience"] as const;

export type SectionId = (typeof sectionIds)[number];

export function scrollToSection(id: SectionId | "hero") {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}
