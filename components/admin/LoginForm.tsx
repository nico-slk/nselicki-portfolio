"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { cardClass, Field, primaryButtonClass } from "@/components/admin/ui";
import { isAuthorizedAdmin, loginWithEmail, mapAuthError, subscribeAuth } from "@/lib/firebase/auth";
import { isFirebaseConfigured } from "@/lib/firebase/config";

export default function LoginForm() {
    const router = useRouter();
    const configured = isFirebaseConfigured();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        return subscribeAuth((user) => {
            if (isAuthorizedAdmin(user)) {
                router.replace("/admin/panel");
            }
        });
    }, [router]);

    async function onSubmit(event: FormEvent) {
        event.preventDefault();
        if (!configured) return;
        setLoading(true);
        setError(null);
        try {
            await loginWithEmail(email, password);
            router.replace("/admin/panel");
        } catch (err) {
            setError(mapAuthError(err));
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="flex min-h-[70vh] items-center justify-center">
            <form onSubmit={onSubmit} className={`${cardClass} flex w-full max-w-sm flex-col gap-4 p-6`}>
                <h1 className="text-xl font-extrabold">Acceso privado</h1>
                {!configured && (
                    <p role="alert" className="rounded-lg border border-yellow-400/30 bg-yellow-400/10 p-3 text-xs text-yellow-200">
                        Firebase no está configurado todavía. Completá las variables <code>NEXT_PUBLIC_FIREBASE_*</code> en <code>.env.local</code>.
                    </p>
                )}
                <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="tu-email@ejemplo.com" />
                <Field label="Contraseña" value={password} onChange={setPassword} type="password" />
                {error && (
                    <p role="alert" className="text-sm text-red-300">
                        {error}
                    </p>
                )}
                <button
                    type="submit"
                    className={primaryButtonClass}
                    disabled={!configured || loading || !email || !password}
                >
                    {loading ? "Verificando..." : "Ingresar"}
                </button>
            </form>
        </main>
    );
}
