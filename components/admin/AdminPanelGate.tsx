"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PortfolioContent } from "@/interfaces/content";
import ContentEditor from "@/components/admin/ContentEditor";
import { buttonClass, cardClass } from "@/components/admin/ui";
import { isAuthorizedAdmin, logout, subscribeAuth } from "@/lib/firebase/auth";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { fetchPortfolioContent, type ContentLoadResult } from "@/lib/firebase/content";

type GateState =
    | { kind: "loading" }
    | { kind: "unconfigured" }
    | { kind: "unauthorized"; email?: string | null }
    | { kind: "ready"; data: ContentLoadResult; userEmail: string };

export default function AdminPanelGate() {
    const router = useRouter();
    const [state, setState] = useState<GateState>(() =>
        isFirebaseConfigured() ? { kind: "loading" } : { kind: "unconfigured" }
    );

    useEffect(() => {
        if (!isFirebaseConfigured()) return;

        let cancelled = false;
        const unsubscribe = subscribeAuth(async (user) => {
            if (cancelled) return;
            if (!user) {
                router.replace("/admin");
                return;
            }
            if (!isAuthorizedAdmin(user)) {
                setState({ kind: "unauthorized", email: user.email });
                return;
            }
            try {
                const data = await fetchPortfolioContent();
                if (!cancelled) {
                    setState({ kind: "ready", data, userEmail: user.email ?? "" });
                }
            } catch (error) {
                console.error("[admin] Error al cargar contenido desde Firestore", error);
                if (!cancelled) {
                    setState({ kind: "unauthorized", email: user.email });
                }
            }
        });

        return () => {
            cancelled = true;
            unsubscribe();
        };
    }, [router]);

    if (state.kind === "loading") {
        return (
            <main className="flex min-h-[70vh] items-center justify-center">
                <p className={`${cardClass} px-6 py-4 text-sm text-[rgba(var(--primary-rgb),0.75)]`}>
                    Verificando sesión y cargando contenido…
                </p>
            </main>
        );
    }

    if (state.kind === "unconfigured") {
        return (
            <main className="flex min-h-[70vh] items-center justify-center">
                <div className={`${cardClass} flex max-w-md flex-col gap-3 p-6 text-sm`}>
                    <h1 className="text-lg font-bold">Firebase no configurado</h1>
                    <p className="text-[rgba(var(--primary-rgb),0.75)]">
                        Copiá <code>.env.example</code> a <code>.env.local</code> y completá tus credenciales web de Firebase para habilitar el panel.
                    </p>
                </div>
            </main>
        );
    }

    if (state.kind === "unauthorized") {
        return (
            <main className="flex min-h-[70vh] items-center justify-center">
                <div className={`${cardClass} flex max-w-md flex-col gap-4 p-6 text-sm`}>
                    <h1 className="text-lg font-bold">Acceso denegado</h1>
                    <p className="text-[rgba(var(--primary-rgb),0.75)]">
                        La cuenta {state.email ? <strong>{state.email}</strong> : "actual"} no tiene permisos de administrador.
                    </p>
                    <button
                        type="button"
                        className={buttonClass}
                        onClick={async () => {
                            await logout();
                            router.replace("/admin");
                        }}
                    >
                        Cerrar sesión
                    </button>
                </div>
            </main>
        );
    }

    return (
        <ContentEditor
            initialContent={state.data.content as PortfolioContent}
            initialSource={state.data.source}
            userEmail={state.userEmail}
        />
    );
}
