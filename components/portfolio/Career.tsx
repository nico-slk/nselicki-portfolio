"use client";

import type { Experience } from "@/interfaces/content";
import { useLanguage } from "@/components/LanguageProvider";
import Section, { glassCard, TechChips } from "@/components/portfolio/Section";

const byOrder = <T extends { order?: number }>(a: T, b: T) => (a.order ?? 999) - (b.order ?? 999);

/** Si la descripción tiene varias líneas, cada una se muestra como un ítem de lista. */
function Description({ text }: { text: string }) {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length <= 1) {
        return <p className="mb-3 text-sm text-[rgba(var(--primary-rgb),0.8)]">{text}</p>;
    }
    return (
        <ul className="mb-3 flex list-disc flex-col gap-1 pl-4 text-sm text-[rgba(var(--primary-rgb),0.8)] marker:text-[rgb(var(--secondary-rgb))]">
            {lines.map((line) => (
                <li key={line}>{line}</li>
            ))}
        </ul>
    );
}

export default function Career({ experience }: { experience: Experience[] }) {
    const { dictionary } = useLanguage();
    const t = dictionary.career;

    return (
        <Section id="experience" eyebrow={t.eyebrow} title={t.experience}>
            <ol className="flex flex-col gap-4 border-l border-[rgba(var(--color-border-rgba))] pl-5">
                {[...experience].sort(byOrder).map((item) => (
                    <li key={item.id} className={`${glassCard} relative p-5`}>
                        <span className="absolute top-6 -left-[27px] h-3 w-3 rounded-full bg-[rgb(var(--secondary-rgb))]" />
                        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                            <h3 className="font-bold">{item.role}</h3>
                            <p className="text-xs text-[rgb(var(--secondary-rgb))]">{item.period}</p>
                        </div>
                        <p className="mb-2 text-sm text-[rgba(var(--primary-rgb),0.7)]">{item.company}</p>
                        <Description text={item.description} />
                        <TechChips items={item.technologies} />
                    </li>
                ))}
            </ol>
        </Section>
    );
}
