"use client";

import type { Profile } from "@/interfaces/content";
import { useLanguage } from "@/components/LanguageProvider";
import { useStorageUrl } from "@/hooks/useStorageUrl";
import { scrollToSection } from "@/utils/navigation";
import { chipClass, linkButton, primaryLinkButton } from "@/components/portfolio/Section";

export default function Hero({ profile }: { profile: Profile }) {
    const { dictionary } = useLanguage();
    const t = dictionary.hero;
    const avatarUrl = useStorageUrl(profile.avatarUrl);
    const cvUrl = useStorageUrl(profile.cvUrl);

    return (
        <section id="hero" className="flex w-full scroll-mt-36 items-center px-4 pt-44 pb-16 md:min-h-[85vh] md:pt-36">
            <div className="grid w-full items-center gap-10 md:grid-cols-[1fr_auto]">
                <div className="flex flex-col gap-5">
                    <span className="text-xs font-semibold tracking-[0.2em] text-[rgb(var(--secondary-rgb))] uppercase">
                        {t.eyebrow}
                    </span>
                    <h1 className="text-4xl leading-tight font-extrabold md:text-6xl">{profile.fullName}</h1>
                    <p className="text-xl font-semibold text-[rgb(var(--secondary-rgb))] md:text-2xl">{profile.role}</p>
                    <p className="max-w-2xl text-lg text-[rgba(var(--primary-rgb),0.85)]">{profile.headline}</p>
                    <p className="max-w-2xl text-[rgba(var(--primary-rgb),0.65)]">{profile.about}</p>

                    <ul className="flex flex-wrap gap-2" aria-label="Stack">
                        {profile.stack.map((s) => (
                            <li key={s} className={chipClass}>
                                {s}
                            </li>
                        ))}
                    </ul>

                    <div className="flex flex-wrap gap-3 pt-2">
                        <button type="button" className={primaryLinkButton} onClick={() => scrollToSection("projects")}>
                            {t.ctaProjects}
                        </button>
                        <button type="button" className={linkButton} onClick={() => scrollToSection("contact")}>
                            {t.ctaContact}
                        </button>
                        {cvUrl && (
                            <a className={linkButton} href={cvUrl} target="_blank" rel="noreferrer">
                                {t.downloadCv}
                            </a>
                        )}
                    </div>
                    <p className="text-sm text-[rgba(var(--primary-rgb),0.5)]">
                        📍 {profile.location}
                    </p>
                </div>

                {avatarUrl && (
                    <div className="mx-auto hidden rounded-full border border-[rgba(var(--color-border-rgba))] p-2 shadow-(--shadow-glow-rgba) md:block">
                        {/* eslint-disable-next-line @next/next/no-img-element -- URLs externas o Storage configurables desde el panel */}
                        <img
                            src={avatarUrl}
                            alt={profile.fullName}
                            width={260}
                            height={260}
                            className="h-[260px] w-[260px] rounded-full object-cover"
                        />
                    </div>
                )}
            </div>
        </section>
    );
}
