"use client";

import { useState } from "react";
import type { Project } from "@/interfaces/content";
import { useLanguage } from "@/components/LanguageProvider";
import { useStorageUrls } from "@/hooks/useStorageUrl";
import Modal from "@/components/portfolio/Modal";
import Section, { glassCard, linkButton, primaryLinkButton, TechChips } from "@/components/portfolio/Section";

const byOrder = <T extends { order?: number }>(a: T, b: T) => (a.order ?? 999) - (b.order ?? 999);

function ProjectCard({ project, onSelect }: { project: Project; onSelect: () => void }) {
    const { dictionary } = useLanguage();
    const t = dictionary.projects;
    const screenshots = useStorageUrls(project.screenshots);

    return (
        <article className={`${glassCard} flex flex-col overflow-hidden`}>
            {screenshots[0] && (
                // eslint-disable-next-line @next/next/no-img-element -- URLs externas o Storage configurables desde el panel
                <img src={screenshots[0]} alt={project.name} className="aspect-video w-full object-cover" loading="lazy" />
            )}
            <div className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-bold">{project.name}</h3>
                    {project.featured && (
                        <span className="shrink-0 rounded-full bg-[rgba(var(--secondary-rgb),0.15)] px-2 py-0.5 text-xs text-[rgb(var(--secondary-rgb))]">
                            {t.featured}
                        </span>
                    )}
                </div>
                <p className="flex-1 text-sm text-[rgba(var(--primary-rgb),0.7)]">{project.shortDescription}</p>
                <TechChips items={project.technologies} />
                <div className="flex flex-wrap gap-2 pt-2">
                    <button type="button" className={primaryLinkButton} onClick={onSelect}>
                        {t.viewMore}
                    </button>
                    <a className={linkButton} href={project.githubUrl} target="_blank" rel="noreferrer">
                        {t.github}
                    </a>
                </div>
            </div>
        </article>
    );
}

export default function Projects({ projects }: { projects: Project[] }) {
    const { dictionary } = useLanguage();
    const t = dictionary.projects;
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const sorted = [...projects].sort(byOrder);
    // Se busca por id para que, si cambia el idioma con el modal abierto, se vea la versión traducida.
    const selected = sorted.find((p) => p.id === selectedId) ?? null;

    return (
        <Section id="projects" eyebrow={t.eyebrow} title={t.title} description={t.description}>
            {sorted.length === 0 ? (
                <p className="text-[rgba(var(--primary-rgb),0.6)]">{t.empty}</p>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {sorted.map((project) => (
                        <ProjectCard key={project.id} project={project} onSelect={() => setSelectedId(project.id)} />
                    ))}
                </div>
            )}
            {selected && <ProjectModal project={selected} onClose={() => setSelectedId(null)} />}
        </Section>
    );
}

function ProjectModal({ project, onClose }: { project: Project; onClose: () => void }) {
    const { dictionary } = useLanguage();
    const t = dictionary.projects;
    const screenshots = useStorageUrls(project.screenshots);

    return (
        <Modal title={project.name} closeLabel={t.close} onClose={onClose}>
            <p className="mb-6 whitespace-pre-line text-[rgba(var(--primary-rgb),0.8)]">{project.fullDescription}</p>

            <h4 className="mb-2 text-sm font-semibold text-[rgb(var(--secondary-rgb))]">{t.technologies}</h4>
            <div className="mb-6">
                <TechChips items={project.technologies} />
            </div>

            {screenshots.length > 0 && (
                <>
                    <h4 className="mb-2 text-sm font-semibold text-[rgb(var(--secondary-rgb))]">{t.screenshots}</h4>
                    <div className="mb-6 grid gap-3 sm:grid-cols-2">
                        {screenshots.map((src, i) => (
                            // eslint-disable-next-line @next/next/no-img-element -- URLs externas o Storage configurables desde el panel
                            <img
                                key={src}
                                src={src}
                                alt={`${project.name} ${i + 1}`}
                                className="w-full rounded-lg border border-[rgba(var(--color-border-rgba))]"
                                loading="lazy"
                            />
                        ))}
                    </div>
                </>
            )}

            <div className="flex flex-wrap gap-2">
                <a className={linkButton} href={project.githubUrl} target="_blank" rel="noreferrer">
                    {t.github}
                </a>
                {project.demoUrl && (
                    <a className={primaryLinkButton} href={project.demoUrl} target="_blank" rel="noreferrer">
                        {t.demo}
                    </a>
                )}
            </div>
        </Modal>
    );
}
