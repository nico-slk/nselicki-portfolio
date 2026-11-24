import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type Unsubscribe, type User } from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase/config";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase() ?? "";

/** Verifica en UI si el usuario autenticado coincide con el email admin (si está configurado). */
export function isAuthorizedAdmin(user: User | null): boolean {
    if (!user) return false;
    if (!ADMIN_EMAIL) return true;
    return (user.email ?? "").toLowerCase() === ADMIN_EMAIL;
}

export function subscribeAuth(callback: (user: User | null) => void): Unsubscribe {
    if (!isFirebaseConfigured()) {
        callback(null);
        return () => {};
    }
    return onAuthStateChanged(getFirebaseAuth(), callback);
}

export async function loginWithEmail(email: string, password: string): Promise<User> {
    const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
    if (!isAuthorizedAdmin(credential.user)) {
        await signOut(getFirebaseAuth());
        throw new Error("Esta cuenta no tiene permisos de administrador.");
    }
    return credential.user;
}

export async function logout(): Promise<void> {
    if (!isFirebaseConfigured()) return;
    await signOut(getFirebaseAuth());
}

export function mapAuthError(error: unknown): string {
    const code = typeof error === "object" && error && "code" in error ? String((error as { code: unknown }).code) : "";
    switch (code) {
        case "auth/invalid-credential":
        case "auth/user-not-found":
        case "auth/wrong-password":
            return "Email o contraseña incorrectos.";
        case "auth/invalid-email":
            return "Ingresá un email válido.";
        case "auth/too-many-requests":
            return "Demasiados intentos. Probá de nuevo en unos minutos.";
        case "auth/user-disabled":
            return "Esta cuenta está deshabilitada.";
        default:
            return error instanceof Error ? error.message : "No se pudo iniciar sesión.";
    }
}
