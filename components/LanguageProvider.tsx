"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import type { Locale } from "@/interfaces/content";
import { dictionaries, isLocale, type Dictionary } from "@/locales";

interface LanguageContextValue {
    locale: Locale;
    dictionary: Dictionary;
    toggleLocale: () => void;
}

const STORAGE_KEY = "portfolio-locale";
const LOCALE_EVENT = "portfolio-locale-change";
const LanguageContext = createContext<LanguageContextValue | null>(null);

function subscribeLocale(onStoreChange: () => void) {
    window.addEventListener("storage", onStoreChange);
    window.addEventListener(LOCALE_EVENT, onStoreChange);
    return () => {
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener(LOCALE_EVENT, onStoreChange);
    };
}

function getLocaleSnapshot(): Locale {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isLocale(stored) ? stored : "es";
}

function getServerLocaleSnapshot(): Locale {
    return "es";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
    const locale = useSyncExternalStore(subscribeLocale, getLocaleSnapshot, getServerLocaleSnapshot);

    useEffect(() => {
        document.documentElement.lang = locale;
    }, [locale]);

    const toggleLocale = useCallback(() => {
        const next: Locale = getLocaleSnapshot() === "es" ? "en" : "es";
        window.localStorage.setItem(STORAGE_KEY, next);
        window.dispatchEvent(new Event(LOCALE_EVENT));
    }, []);

    const value = useMemo<LanguageContextValue>(
        () => ({
            locale,
            dictionary: dictionaries[locale],
            toggleLocale
        }),
        [locale, toggleLocale]
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
