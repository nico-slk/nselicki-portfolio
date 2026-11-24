import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getFirebaseStorage, isFirebaseConfigured } from "@/lib/firebase/config";
import { contentTypeFor, isSafeKey } from "@/lib/storage/keys";

export type PortfolioStorageFolder = "diplomas" | "cv" | "media";

const urlCache = new Map<string, string>();

/** Devuelve true si ya es una URL completa, ruta local de `public/` o data URI. */
export function isDirectUrl(value: string): boolean {
    const trimmed = value.trim();
    return trimmed.startsWith("/") || /^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:");
}

/**
 * Resuelve una clave de Firebase Storage (ej. `diplomas/utn.pdf`) a su URL
 * de descarga. Si ya es una URL directa o ruta de `/public`, la devuelve sin cambios.
 */
export async function resolveStorageUrl(pathOrUrl: string): Promise<string | null> {
    const trimmed = pathOrUrl.trim();
    if (!trimmed) return null;
    if (isDirectUrl(trimmed)) return trimmed;

    const cached = urlCache.get(trimmed);
    if (cached) return cached;

    if (!isFirebaseConfigured() || !isSafeKey(trimmed)) return null;

    try {
        const url = await getDownloadURL(ref(getFirebaseStorage(), trimmed));
        urlCache.set(trimmed, url);
        return url;
    } catch {
        return null;
    }
}

function sanitizeFilename(name: string): string {
    const clean = name
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^A-Za-z0-9._-]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return clean || `archivo-${Date.now()}`;
}

/** Sube un archivo público del portfolio a Firebase Storage y devuelve su clave y URL. */
export async function uploadPortfolioFile(
    folder: PortfolioStorageFolder,
    file: File
): Promise<{ path: string; url: string }> {
    const safeName = sanitizeFilename(file.name);
    const key = `${folder}/${Date.now().toString(36)}-${safeName}`;
    const storageRef = ref(getFirebaseStorage(), key);

    await uploadBytes(storageRef, file, {
        contentType: file.type || contentTypeFor(safeName),
        cacheControl: "public, max-age=3600"
    });

    const url = await getDownloadURL(storageRef);
    urlCache.set(key, url);
    return { path: key, url };
}

export async function deleteStorageFile(path: string): Promise<void> {
    if (!isFirebaseConfigured() || !isSafeKey(path)) return;
    urlCache.delete(path);
    await deleteObject(ref(getFirebaseStorage(), path));
}
