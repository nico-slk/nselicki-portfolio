"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Locale } from "@/interfaces/content";
import { dictionaries, isLocale, type Dictionary } from "@/locales";

interface LanguageContextValue {
    locale: Locale;
    dictionary: Dictionary;
    toggleLocale: () => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [locale, setLocale] = useState<Locale>("es");

    useEffect(() => {
        const storedLocale = window.localStorage.getItem("portfolio-locale");
        if (isLocale(storedLocale)) {
            setLocale(storedLocale);
        }
    }, []);

    useEffect(() => {
        document.documentElement.lang = locale;
        window.localStorage.setItem("portfolio-locale", locale);
    }, [locale]);

    const value = useMemo<LanguageContextValue>(
        () => ({
            locale,
            dictionary: dictionaries[locale],
            toggleLocale: () => setLocale((current: Locale) => (current === "es" ? "en" : "es"))
        }),
        [locale]
    );

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error("useLanguage must be used inside LanguageProvider.");
    }

    return context;
}
