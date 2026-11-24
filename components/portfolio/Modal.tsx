"use client";

import { useEffect, type ReactNode } from "react";
import { glassCard, linkButton } from "@/components/portfolio/Section";

interface ModalProps {
    title: string;
    subtitle?: string;
    closeLabel: string;
    onClose: () => void;
    children: ReactNode;
    size?: "md" | "lg";
}

/** Modal accesible: cierra con Escape o clic afuera y bloquea el scroll de fondo. */
export default function Modal({ title, subtitle, closeLabel, onClose, children, size = "md" }: ModalProps) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = previous;
            window.removeEventListener("keydown", onKey);
        };
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-4"
            onClick={onClose}
            role="presentation"
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                className={`${glassCard} max-h-[92vh] w-full ${size === "lg" ? "max-w-5xl" : "max-w-3xl"} overflow-y-auto bg-[rgba(10,10,24,0.95)] p-5 sm:p-6`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                        <h3 id="modal-title" className="text-xl font-extrabold sm:text-2xl">
                            {title}
                        </h3>
                        {subtitle && <p className="text-sm text-[rgba(var(--primary-rgb),0.65)]">{subtitle}</p>}
                    </div>
                    <button type="button" className={linkButton} onClick={onClose} aria-label={closeLabel} autoFocus>
                        ✕
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}
