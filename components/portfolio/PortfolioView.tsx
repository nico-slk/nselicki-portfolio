"use client";

import { useEffect, useState } from "react";
import type { PortfolioContent } from "@/interfaces/content";
import { fetchPortfolioContent } from "@/lib/firebase/content";
import { useLanguage } from "@/components/LanguageProvider";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import Hero from "@/components/portfolio/Hero";
import Projects from "@/components/portfolio/Projects";
import Career from "@/components/portfolio/Career";
import Education from "@/components/portfolio/Education";
import Contact from "@/components/portfolio/Contact";

/**
 * Vista pública completa. Renderiza de inmediato con el contenido inicial
 * y sincroniza los últimos cambios desde Firestore al montar en el cliente.
 */
export default function PortfolioView({ initialContent }: { initialContent: PortfolioContent }) {
    const [content, setContent] = useState(initialContent);
    const { locale } = useLanguage();

    useEffect(() => {
        let cancelled = false;
        fetchPortfolioContent()
            .then(({ content: remote }) => {
                if (!cancelled) setContent(remote);
            })
            .catch((error) => {
                console.warn("[portfolio] No se pudo cargar el contenido desde Firestore; se usa el respaldo local.", error);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const data = content.locales[locale];

    return (
        <div className="flex min-h-screen flex-col items-center font-sans">
            <Header visible={true} name={data.profile.fullName} />
            <main className="flex w-full max-w-6xl flex-1 flex-col">
                <Hero profile={data.profile} />
                <Projects projects={data.projects} />
                <Career experience={data.experience} />
                <Education education={data.education} />
                <Contact profile={data.profile} socialLinks={content.socialLinks} />
            </main>
            <Footer name={data.profile.fullName} socialLinks={content.socialLinks} />
        </div>
    );
}
