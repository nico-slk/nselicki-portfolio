"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Renderiza un PDF en <canvas> con pdf.js. Funciona igual en desktop y móvil
 * (Android Chrome no muestra PDFs dentro de iframes; iOS solo la primera página).
 * pdf.js se carga recién cuando se abre la vista previa, no en la carga inicial.
 */
export default function PdfViewer({
    url,
    title,
    loadingText,
    errorText,
    onReady
}: {
    url: string;
    title: string;
    loadingText: string;
    errorText: string;
    onReady?: () => void;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

    useEffect(() => {
        let cancelled = false;
        const container = containerRef.current;
        if (!container) return;

        (async () => {
            try {
                const pdfjs = await import("pdfjs-dist");
                pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

                const doc = await pdfjs.getDocument({ url }).promise;
                const width = container.clientWidth || 800;
                const ratio = Math.min(window.devicePixelRatio || 1, 2);
                const canvases: HTMLCanvasElement[] = [];

                for (let n = 1; n <= Math.min(doc.numPages, 10); n++) {
                    const page = await doc.getPage(n);
                    const base = page.getViewport({ scale: 1 });
                    const viewport = page.getViewport({ scale: (width / base.width) * ratio });
                    const canvas = document.createElement("canvas");
                    canvas.width = Math.floor(viewport.width);
                    canvas.height = Math.floor(viewport.height);
                    canvas.style.width = "100%";
                    canvas.style.height = "auto";
                    canvas.setAttribute("aria-label", `${title} — ${n}/${doc.numPages}`);
                    await page.render({ canvas, viewport }).promise;
                    canvases.push(canvas);
                }
                if (cancelled) return;
                container.replaceChildren(...canvases);
                setStatus("ready");
                onReady?.();
            } catch (error) {
                console.warn("[PdfViewer] No se pudo renderizar el PDF", error);
                if (!cancelled) setStatus("error");
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [url, title, onReady]);

    return (
        <div className="relative max-h-[65vh] overflow-y-auto bg-white">
            {status !== "ready" && (
                <p className="flex min-h-[40vh] items-center justify-center p-6 text-center text-sm text-[#0a0a18]/70">
                    {status === "loading" ? loadingText : errorText}
                </p>
            )}
            <div ref={containerRef} className="flex flex-col gap-2" role="img" aria-label={title} />
        </div>
    );
}
