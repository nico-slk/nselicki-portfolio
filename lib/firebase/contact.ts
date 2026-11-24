import { collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, setDoc } from "firebase/firestore";
import { deleteObject, ref, uploadBytes } from "firebase/storage";
import type { ContactPayload } from "@/interfaces/content";
import { validateAttachment, validateContact, type StoredContactMessage } from "@/lib/contact/service";
import { getFirebaseDb, getFirebaseStorage, isFirebaseConfigured } from "@/lib/firebase/config";

export const CONTACT_COLLECTION = "contactMessages";

function sanitizeAttachmentName(name: string): string {
    return (
        name
            .normalize("NFD")
            .replace(/[̀-ͯ]/g, "")
            .replace(/[^A-Za-z0-9._-]+/g, "-")
            .replace(/^-+|-+$/g, "") || "adjunto"
    );
}

/**
 * Envía un mensaje del formulario de contacto directo a Firestore + Storage.
 * Si Firebase aún no está configurado, simula el envío en modo local.
 */
export async function submitContactMessage(
    input: ContactPayload,
    attachment?: File | null
): Promise<{ id: string; mode: "firebase" | "mock" }> {
    const validated = validateContact(input);
    if (!validated.ok) {
        const err = new Error("Datos de contacto inválidos") as Error & { fieldErrors?: Record<string, string> };
        err.fieldErrors = validated.errors;
        throw err;
    }

    if (attachment && attachment.size > 0) {
        const fileError = validateAttachment(attachment);
        if (fileError) {
            const err = new Error("Adjunto inválido") as Error & { fieldErrors?: Record<string, string> };
            err.fieldErrors = { attachment: fileError };
            throw err;
        }
    }

    if (!isFirebaseConfigured()) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        return { id: `mock-${Date.now().toString(36)}`, mode: "mock" };
    }

    const db = getFirebaseDb();
    const messageRef = doc(collection(db, CONTACT_COLLECTION));
    const createdAtIso = new Date().toISOString();

    let attachmentMeta:
        | {
              attachmentPath: string;
              attachmentName: string;
              attachmentType: string;
              attachmentSize: number;
          }
        | undefined;

    if (attachment && attachment.size > 0) {
        const safeName = sanitizeAttachmentName(attachment.name);
        const attachmentPath = `contact-attachments/${messageRef.id}/${safeName}`;
        await uploadBytes(ref(getFirebaseStorage(), attachmentPath), attachment, {
            contentType: attachment.type
        });
        attachmentMeta = {
            attachmentPath,
            attachmentName: attachment.name.slice(0, 200),
            attachmentType: attachment.type,
            attachmentSize: attachment.size
        };
    }

    await setDoc(messageRef, {
        fullName: validated.value.fullName,
        email: validated.value.email,
        message: validated.value.message,
        createdAt: serverTimestamp(),
        createdAtIso,
        ...(attachmentMeta ?? {})
    });

    return { id: messageRef.id, mode: "firebase" };
}

/** Lista los mensajes recibidos (requiere sesión admin en Firestore Rules). */
export async function fetchContactMessages(): Promise<StoredContactMessage[]> {
    if (!isFirebaseConfigured()) return [];
    const q = query(collection(getFirebaseDb(), CONTACT_COLLECTION), orderBy("createdAtIso", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        return {
            id: d.id,
            fullName: String(data.fullName ?? ""),
            email: String(data.email ?? ""),
            message: String(data.message ?? ""),
            receivedAt: String(data.createdAtIso ?? ""),
            attachmentPath: typeof data.attachmentPath === "string" ? data.attachmentPath : undefined,
            attachment:
                typeof data.attachmentName === "string"
                    ? {
                          name: data.attachmentName,
                          type: String(data.attachmentType ?? ""),
                          size: Number(data.attachmentSize ?? 0)
                      }
                    : undefined
        };
    });
}

export async function deleteContactMessage(msg: StoredContactMessage): Promise<void> {
    if (!isFirebaseConfigured()) return;
    if (msg.attachmentPath) {
        await deleteObject(ref(getFirebaseStorage(), msg.attachmentPath)).catch(() => undefined);
    }
    await deleteDoc(doc(getFirebaseDb(), CONTACT_COLLECTION, msg.id));
}
