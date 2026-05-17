'use client'

import { useActiveSection } from "@/hooks/useActiveSection";
import { scrollToSection, SectionId, sectionIds } from "@/utils/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { useMemo } from "react";


const Header = ({ visible }: { visible: boolean }) => {
  const { dictionary, locale, toggleLocale } = useLanguage();
  const ids = useMemo(() => [...sectionIds], []);
  const activeSection = useActiveSection(ids);

  const items: Array<{ id: SectionId; label: string }> = [
    { id: "contact", label: dictionary.nav.contact },
    { id: "projects", label: dictionary.nav.projects },
    { id: "education", label: dictionary.nav.education },
    { id: "experience", label: dictionary.nav.experience }
  ];

  return (
    <div className={`w-full max-w-6xl ${visible ? "isVisible" : "isHidden"}`}>

      {/* <header className={styles.header} > */}
      <header
        className={`
          fixed
          left-1/2
          top-4
          z-20

          w-[calc(100%-1.5rem)]
          max-w-6xl

          border
          border-[rgba(var(--color-border-rgba))]
          bg-[rgba(10,10,24,0.68)]
          shadow-(--shadow-glow-rgba)
          backdrop-blur-[18px]

          flex flex-col lg:flex-row
          items-start lg:items-center
          justify-between
          gap-4

          px-4 py-[0.9rem]

          rounded-lg

          min-h-19

          -translate-x-1/2

          transition-[opacity,transform,visibility]
          duration-260
          ease-in-out

          ${visible
            ? "opacity-100 visible translate-y-0"
            : "opacity-0 invisible translate-y-[-120%]"
          }
        `}
      >
        <button className="border-0 bg-transparent" type="button" onClick={() => scrollToSection("hero")} aria-label="Home">
          {/* <span className="
            grid
            w-10.5
            h-10.5
            place-items-center
            border
            border-[rgb(var(--color-border))]
            rounded-lg
            text-[rgb(var(--color-background))]
            bg-[rgb(var(--color-secondary))]
            font-(--secondary-font)
          ">DI</span> */}
          <span className="font-extrabold ">{dictionary.hero.name}</span>
        </button>
        <nav className="flex  items-center gap-4 flex-nowrap overflow-x-auto pb-[0.2rem] md:flex-wrap" aria-label="Primary navigation">
          {items.map((item) => (
            <button
              className={`
                border-0 
                bg-transparent 
                rounded-lg
                text-[rgb(var(--color-muted-rgb))]
                transition-[color,background-color,transform]
                duration-180
                ease-in-out
                min-h-9
                px-2
                text-[1rem]

                md:min-h-10
                md:px-3

                hover:text-[rgb(var(--color-primary))]
                hover:bg-[rgba(255,252,221,0.08)]
                hover:-translate-y-px
                focus-visible:outline-2
                focus-visible:outline-[rgb(var(--secondary-rgb))]
                focus-visible:outline-offset-4
                ${activeSection === item.id
                  ? "-translate-x-px text-[rgb(var(--color-primary))] bg-[rgba(255,252,221,0.08)] "
                  : ""}
                `}
              key={item.id}
              type="button"
              onClick={() => scrollToSection(item.id)}
              aria-current={activeSection === item.id ? "page" : undefined}
            >
              {item.label}
            </button>
          ))}
          <button className="languageButton" type="button" onClick={toggleLocale} aria-label="Change language">
            {locale === "es" ? "EN" : "ES"}
          </button>
        </nav>
      </header>
    </div>
  )
}

export default Header