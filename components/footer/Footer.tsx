"use client";

import type { SocialLink } from "@/interfaces/content";
import { useLanguage } from "@/components/LanguageProvider";
import { scrollToSection, type SectionId } from "@/utils/navigation";

const Footer = ({ name, socialLinks = [] }: { name: string; socialLinks?: SocialLink[] }) => {
  const { dictionary } = useLanguage();
  const nav: Array<{ id: SectionId; label: string }> = [
    { id: "projects", label: dictionary.nav.projects },
    { id: "experience", label: dictionary.nav.experience },
    { id: "education", label: dictionary.nav.education },
    { id: "contact", label: dictionary.nav.contact }
  ];

  return (
    <footer className="mt-10 w-full border-t border-[rgba(var(--color-border-rgba))] bg-[rgba(10,10,24,0.6)] backdrop-blur-[18px]">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
        <div className="flex flex-col gap-2">
          <span className="text-lg font-extrabold">{name}</span>
          <button
            type="button"
            className="self-start text-sm text-[rgba(var(--primary-rgb),0.6)] hover:text-[rgb(var(--secondary-rgb))]"
            onClick={() => scrollToSection("hero")}
          >
            ↑ {dictionary.footer.backToTop}
          </button>
        </div>

        <nav aria-label={dictionary.footer.quickNav} className="flex flex-col gap-2">
          <span className="text-xs font-semibold tracking-[0.2em] text-[rgb(var(--secondary-rgb))] uppercase">
            {dictionary.footer.quickNav}
          </span>
          {nav.map((item) => (
            <button
              key={item.id}
              type="button"
              className="self-start text-sm text-[rgba(var(--primary-rgb),0.75)] hover:text-[rgb(var(--secondary-rgb))]"
              onClick={() => scrollToSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <ul className="flex flex-col gap-2">
          {socialLinks.map((link) => (
            <li key={link.href}>
              <a
                className="text-sm text-[rgba(var(--primary-rgb),0.75)] hover:text-[rgb(var(--secondary-rgb))]"
                href={link.href}
                target="_blank"
                rel="noreferrer"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <p className="pb-6 text-center text-xs text-[rgba(var(--primary-rgb),0.45)]">
        © {new Date().getFullYear()} {name}. {dictionary.footer.copyright}
      </p>
    </footer>
  );
};

export default Footer;
