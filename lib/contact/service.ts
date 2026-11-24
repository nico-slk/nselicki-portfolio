import type { ContactPayload } from "@/interfaces/content";

/**
 * Validaciones compartidas del formulario de contacto (sin dependencias de Node).
 */
export interface ContactAttachment {
    name: string;
    type: string;
    size: number;
}

export interface StoredContactMessage extends ContactPayload {
    id: string;
    receivedAt: string;
    attachmentPath?: string;
    attachment?: ContactAttachment;
}

export const ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024;
export const ATTACHMENT_TYPES: Record<string, string[]> = {
    "application/pdf": [".pdf"],
    "image/jpeg": [".jpg", ".jpeg"],
    "application/msword": [".doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"]
};

/** Valida los campos de texto del formulario. Devuelve errores por campo. */
export function validateContact(input: {
    fullName: unknown;
    email: unknown;
    message: unknown;
}): { ok: true; value: ContactPayload } | { ok: false; errors: Record<string, string> } {
    const errors: Record<string, string> = {};
    const fullName = typeof input.fullName === "string" ? input.fullName.trim() : "";
    const email = typeof input.email === "string" ? input.email.trim() : "";
    const message = typeof input.message === "string" ? input.message.trim() : "";

    if (fullName.length < 2 || fullName.length > 120) errors.fullName = "invalid";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) errors.email = "invalid";
    if (message.length < 10 || message.length > 5000) errors.message = "invalid";

    return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value: { fullName, email, message } };
}

export function validateAttachment(file: File): string | null {
    if (file.size > ATTACHMENT_MAX_BYTES) return "too_large";
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    const allowed = ATTACHMENT_TYPES[file.type];
    if (!allowed || !allowed.includes(ext)) return "invalid_type";
    return null;
}
