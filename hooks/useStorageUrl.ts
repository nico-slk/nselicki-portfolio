"use client";

import { useEffect, useState } from "react";
import { isDirectUrl, resolveStorageUrl } from "@/lib/firebase/storage";

/** Resuelve una ruta de Firebase Storage a URL pública; URLs directas se devuelven al instante. */
export function useStorageUrl(pathOrUrl?: string): string | null {
    const trimmed = pathOrUrl?.trim() ?? "";
    const direct = trimmed && isDirectUrl(trimmed) ? trimmed : null;
    const [resolved, setResolved] = useState<{ key: string; url: string | null }>({ key: "", url: null });

    useEffect(() => {
        if (!trimmed || direct) return;
        let cancelled = false;
        resolveStorageUrl(trimmed).then((url) => {
            if (!cancelled) setResolved({ key: trimmed, url });
        });
        return () => {
            cancelled = true;
        };
    }, [trimmed, direct]);

    if (!trimmed) return null;
    if (direct) return direct;
    return resolved.key === trimmed ? resolved.url : null;
}

/** Resuelve múltiples rutas de Firebase Storage preservando el orden original. */
export function useStorageUrls(paths: string[]): string[] {
    const serialized = paths.join("\0");
    const [resolvedMap, setResolvedMap] = useState<Record<string, string>>({});

    useEffect(() => {
        const pending = paths.filter((p) => p.trim() && !isDirectUrl(p));
        if (pending.length === 0) return;

        let cancelled = false;
        Promise.all(pending.map(async (p) => [p, await resolveStorageUrl(p)] as const)).then((entries) => {
            if (cancelled) return;
            setResolvedMap((prev) => {
                const next = { ...prev };
                for (const [key, url] of entries) {
                    if (url) next[key] = url;
                }
                return next;
            });
        });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serialized]);

    return paths
        .map((p) => {
            const trimmed = p.trim();
            if (!trimmed) return null;
            if (isDirectUrl(trimmed)) return trimmed;
            return resolvedMap[trimmed] ?? null;
        })
        .filter((u): u is string => Boolean(u));
}
