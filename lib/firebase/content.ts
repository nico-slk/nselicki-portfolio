import { doc, getDoc, setDoc } from "firebase/firestore";
import mockContent from "@/data/mock/content.mock.json";
import type { PortfolioContent } from "@/interfaces/content";
import { validatePortfolioContent } from "@/lib/content/validation";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase/config";

export const PORTFOLIO_COLLECTION = "portfolio";
export const PORTFOLIO_DOC_ID = "content";

export type ContentLoadResult = {
    content: PortfolioContent;
    source: "firestore" | "mock";
};

export function getMockPortfolioContent(): PortfolioContent {
    return structuredClone(mockContent) as PortfolioContent;
}

/**
 * Lee el documento del portfolio desde Firestore.
 * Si Firebase aún no está configurado o el documento todavía no existe,
 * devuelve los datos mock como respaldo para evitar pantallas vacías.
 */
export async function fetchPortfolioContent(): Promise<ContentLoadResult> {
    if (!isFirebaseConfigured()) {
        return { content: getMockPortfolioContent(), source: "mock" };
    }
    const ref = doc(getFirebaseDb(), PORTFOLIO_COLLECTION, PORTFOLIO_DOC_ID);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
        return { content: getMockPortfolioContent(), source: "mock" };
    }
    return { content: snap.data() as PortfolioContent, source: "firestore" };
}

/** Valida y guarda el documento completo en Firestore (`portfolio/content`). */
export async function savePortfolioContent(input: PortfolioContent): Promise<PortfolioContent> {
    const result = validatePortfolioContent(input);
    if (!result.ok) {
        const error = new Error("Contenido inválido") as Error & { validationErrors?: string[] };
        error.validationErrors = result.errors;
        throw error;
    }

    const ref = doc(getFirebaseDb(), PORTFOLIO_COLLECTION, PORTFOLIO_DOC_ID);
    // Firestore rechaza propiedades con valor `undefined`; el normalizador ya los omite,
    // pero aseguramos serialización limpia antes de escribir.
    const clean = JSON.parse(JSON.stringify(result.value)) as PortfolioContent;
    await setDoc(ref, clean);
    return clean;
}

/** Inicializa Firestore con los datos mock actuales (útil en el primer despliegue). */
export async function seedMockContentToFirestore(): Promise<PortfolioContent> {
    return savePortfolioContent(getMockPortfolioContent());
}
