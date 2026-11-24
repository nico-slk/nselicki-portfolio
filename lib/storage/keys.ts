/** Utilidades de claves de storage sin dependencias de Node (usables en cliente y servidor). */

const CONTENT_TYPES: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp"
};

export function extensionOf(key: string): string {
    const clean = key.split(/[?#]/)[0];
    const dot = clean.lastIndexOf(".");
    return dot >= 0 ? clean.slice(dot + 1).toLowerCase() : "";
}

export function contentTypeFor(key: string): string {
    return CONTENT_TYPES[extensionOf(key)] ?? "application/octet-stream";
}

export type PreviewKind = "pdf" | "image" | "other";

export function previewKindFor(key: string): PreviewKind {
    const type = contentTypeFor(key);
    if (type === "application/pdf") return "pdf";
    if (type.startsWith("image/")) return "image";
    return "other";
}

/** Clave segura: relativa, sin `..`, solo caracteres simples. */
export function isSafeKey(key: string): boolean {
    return /^[A-Za-z0-9][A-Za-z0-9/_.-]*$/.test(key) && !key.split("/").includes("..") && !key.includes("//");
}
