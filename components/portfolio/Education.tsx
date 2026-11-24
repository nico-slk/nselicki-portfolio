"use client";

import { useCallback, useState, type ReactNode } from "react";
import type { Education as EducationItem, EducationKind } from "@/interfaces/content";
import { useLanguage } from "@/components/LanguageProvider";
import { useStorageUrl } from "@/hooks/useStorageUrl";
import Modal from "@/components/portfolio/Modal";
import PdfViewer from "@/components/portfolio/PdfViewer";
import Section, { glassCard, linkButton, primaryLinkButton } from "@/components/portfolio/Section";
import { previewKindFor, type PreviewKind } from "@/lib/storage/keys";

const byOrder = <T extends { order?: number }>(a: T, b: T) => (a.order ?? 999) - (b.order ?? 999);

function useDiplomaResource(item: EducationItem): { url: string | null; kind: PreviewKind } {
    const resolvedStorageUrl = useStorageUrl(item.diplomaPath);
    const url = item.diplomaPath ? resolvedStorageUrl : item.diplomaUrl ?? null;
    const kind = previewKindFor(item.diplomaPath || item.diplomaUrl || "");
    return { url, kind };
}

function EducationCard({ item, onPreview }: { item: EducationItem; onPreview: () => void }) {
    const { dictionary } = useLanguage();
    const t = dictionary.education;
    const { url } = useDiplomaResource(item);

    return (
        <li
            className={`${glassCard} group relative flex flex-col gap-4 overflow-hidden p-5 transition-transform duration-200 hover:-translate-y-0.5`}
        >
            {/* Franja de acento a la izquierda */}
            <span className="absolute inset-y-0 left-0 w-1 bg-[rgb(var(--secondary-rgb))] opacity-70" aria-hidden="true" />

            <div className="flex items-start gap-4">
                <KindIcon kind={item.kind} />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                        {item.kind && (
                            <span className="rounded-full bg-[rgba(var(--secondary-rgb),0.12)] px-2.5 py-0.5 text-[0.7rem] font-semibold tracking-wide text-[rgb(var(--secondary-rgb))] uppercase">
                                {t.kinds[item.kind]}
                            </span>
                        )}
                        {item.period && (
                            <span className="text-xs text-[rgba(var(--primary-rgb),0.55)]">{item.period}</span>
                        )}
                    </div>
                    <h3 className="text-lg leading-snug font-bold">{item.title}</h3>
                    {item.institution && (
                        <p className="text-sm text-[rgba(var(--primary-rgb),0.7)]">{item.institution}</p>
                    )}
                    {item.description && (
                        <p className="mt-1 text-sm text-[rgba(var(--primary-rgb),0.75)]">{item.description}</p>
                    )}
                </div>
            </div>

            <div className="mt-auto flex flex-wrap gap-2 border-t border-[rgba(var(--color-border-rgba))] pt-4">
                {url ? (
                    <>
                        <button type="button" className={primaryLinkButton} onClick={onPreview}>
                            <EyeIcon /> {t.preview}
                        </button>
                        <a className={linkButton} href={url} target="_blank" rel="noreferrer" download>
                            <DownloadIcon /> {t.download}
                        </a>
                    </>
                ) : (
                    <span className="text-sm text-[rgba(var(--primary-rgb),0.45)]">{t.noDiploma}</span>
                )}
            </div>
        </li>
    );
}

export default function Education({ education }: { education: EducationItem[] }) {
    const { dictionary } = useLanguage();
    const t = dictionary.education;
    const [previewId, setPreviewId] = useState<string | null>(null);
    const items = [...education].sort(byOrder);
    const selected = items.find((e) => e.id === previewId) ?? null;

    return (
        <Section id="education" eyebrow={t.eyebrow} title={t.title} description={t.description}>
            <ul className="grid gap-5 md:grid-cols-2">
                {items.map((item) => (
                    <EducationCard key={item.id} item={item} onPreview={() => setPreviewId(item.id)} />
                ))}
            </ul>

            {selected && <DiplomaPreview key={selected.id} item={selected} onClose={() => setPreviewId(null)} />}
        </Section>
    );
}

function DiplomaPreview({ item, onClose }: { item: EducationItem; onClose: () => void }) {
    const { dictionary } = useLanguage();
    const t = dictionary.education;
    const { url, kind } = useDiplomaResource(item);
    const [loaded, setLoaded] = useState(false);
    const markLoaded = useCallback(() => setLoaded(true), []);
    if (!url) return null;

    return (
        <Modal title={item.title} subtitle={item.institution} closeLabel={t.close} onClose={onClose} size="lg">
            <div className="relative overflow-hidden rounded-lg border border-[rgba(var(--color-border-rgba))] bg-[rgba(255,252,221,0.04)]">
                {!loaded && kind === "image" && (
                    <p className="absolute inset-0 flex items-center justify-center text-sm text-[rgba(var(--primary-rgb),0.6)]">
                        {t.loading}
                    </p>
                )}
                {kind === "pdf" && (
                    <PdfViewer
                        url={url}
                        title={item.title}
                        loadingText={t.loading}
                        errorText={t.fallback}
                        onReady={markLoaded}
                    />
                )}
                {kind === "image" && (
                    // eslint-disable-next-line @next/next/no-img-element -- archivo servido desde Firebase Storage o URL externa
                    <img
                        src={url}
                        alt={item.title}
                        className="relative mx-auto max-h-[65vh] w-auto object-contain"
                        onLoad={() => setLoaded(true)}
                    />
                )}
                {kind === "other" && <p className="p-8 text-center text-sm">{t.fallback}</p>}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
                <a className={primaryLinkButton} href={url} target="_blank" rel="noreferrer" download>
                    <DownloadIcon /> {t.download}
                </a>
                <a className={linkButton} href={url} target="_blank" rel="noreferrer">
                    {t.openNewTab}
                </a>
            </div>
        </Modal>
    );
}

/* ---------- Íconos (SVG inline, sin dependencias) ---------- */

function KindIcon({ kind }: { kind?: EducationKind }) {
    const paths: Record<EducationKind, ReactNode> = {
        degree: (
            <>
                <path d="M3 9l9-5 9 5-9 5-9-5z" />
                <path d="M7 11.5V16c0 1 2.2 2.5 5 2.5s5-1.5 5-2.5v-4.5" />
                <path d="M21 9v5" />
            </>
        ),
        bootcamp: (
            <>
                <path d="M8 9l-4 3 4 3" />
                <path d="M16 9l4 3-4 3" />
                <path d="M13.5 6l-3 12" />
            </>
        ),
        course: (
            <>
                <path d="M4 5.5A1.5 1.5 0 015.5 4H11v15H5.5A1.5 1.5 0 014 17.5v-12z" />
                <path d="M20 5.5A1.5 1.5 0 0018.5 4H13v15h5.5a1.5 1.5 0 001.5-1.5v-12z" />
            </>
        ),
        certification: (
            <>
                <circle cx="12" cy="9" r="5" />
                <path d="M9 13.5L7.5 20l4.5-2.5 4.5 2.5L15 13.5" />
            </>
        )
    };
    return (
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[rgba(var(--color-border-rgba))] bg-[rgba(var(--secondary-rgb),0.08)] text-[rgb(var(--secondary-rgb))]">
            <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                {paths[kind ?? "course"]}
            </svg>
        </span>
    );
}

function EyeIcon() {
    return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5" aria-hidden="true">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}

function DownloadIcon() {
    return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5" aria-hidden="true">
            <path d="M12 4v11" />
            <path d="M7 10l5 5 5-5" />
            <path d="M5 20h14" />
        </svg>
    );
}
