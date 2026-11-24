import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

/**
 * Configuración del SDK web de Firebase (sin backend).
 * Next.js reemplaza `process.env.NEXT_PUBLIC_*` en tiempo de compilación solo
 * cuando se accede de forma estática por nombre exacto.
 */
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() ?? "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim() ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim() ?? ""
};

export function isFirebaseConfigured(): boolean {
    return Boolean(
        firebaseConfig.apiKey &&
            firebaseConfig.authDomain &&
            firebaseConfig.projectId &&
            firebaseConfig.storageBucket &&
            firebaseConfig.appId
    );
}

export function getFirebaseApp(): FirebaseApp {
    if (!isFirebaseConfigured()) {
        throw new Error("Firebase no está configurado. Completá las variables NEXT_PUBLIC_FIREBASE_* en .env.local.");
    }
    return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

export function getFirebaseAuth(): Auth {
    return getAuth(getFirebaseApp());
}

export function getFirebaseDb(): Firestore {
    return getFirestore(getFirebaseApp());
}

export function getFirebaseStorage(): FirebaseStorage {
    return getStorage(getFirebaseApp());
}
