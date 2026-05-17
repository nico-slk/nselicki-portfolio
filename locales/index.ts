import { en } from "@/locales/en";
import { es } from "@/locales/es";
import type { Locale } from "@/interfaces/content";

export const dictionaries = { es, en };

export type Dictionary = (typeof dictionaries)[keyof typeof dictionaries];

export function isLocale(value: string | null): value is Locale {
    return value === "es" || value === "en";
}
