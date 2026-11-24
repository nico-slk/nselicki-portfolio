import type { ReactNode } from "react";

export const glassCard = `
  rounded-xl border border-[rgba(var(--color-border-rgba))]
  bg-[rgba(10,10,24,0.68)] shadow-(--shadow-glow-rgba) backdrop-blur-[18px]
`;

export const chipClass = `
  rounded-full border border-[rgba(var(--color-border-rgba))] px-3 py-1 text-xs
  text-[rgba(var(--primary-rgb),0.85)]
`;

export const linkButton = `
  inline-flex items-center justify-center rounded-lg border border-[rgba(var(--color-border-rgba))]
  px-4 py-2 text-sm transition-colors duration-150 hover:bg-[rgba(255,252,221,0.08)]
`;

export const primaryLinkButton = `
  inline-flex items-center justify-center rounded-lg bg-[rgb(var(--secondary-rgb))]
  px-4 py-2 text-sm font-semibold text-[#0a0a18] transition-opacity duration-150 hover:opacity-90
  disabled:cursor-not-allowed disabled:opacity-50
`;

interface SectionProps {
    id?: string;
    eyebrow?: string;
    title: string;
    description?: string;
    children: ReactNode;
}

/** Encabezado y contenedor común para las secciones de la home. */
export default function Section({ id, eyebrow, title, description, children }: SectionProps) {
    return (
        <section id={id} className="w-full scroll-mt-36 px-4 py-16 md:scroll-mt-28">
            <header className="mb-8 flex flex-col gap-2">
                {eyebrow && (
                    <span className="text-xs font-semibold tracking-[0.2em] text-[rgb(var(--secondary-rgb))] uppercase">
                        {eyebrow}
                    </span>
                )}
                <h2 className="text-3xl font-extrabold md:text-4xl">{title}</h2>
                {description && <p className="max-w-2xl text-[rgba(var(--primary-rgb),0.7)]">{description}</p>}
            </header>
            {children}
        </section>
    );
}

export function TechChips({ items }: { items: { name: string }[] }) {
    return (
        <ul className="flex flex-wrap gap-2">
            {items.map((t) => (
                <li key={t.name} className={chipClass}>
                    {t.name}
                </li>
            ))}
        </ul>
    );
}
