"use client";

import { useRef, useState, type FormEvent } from "react";
import type { Profile, SocialLink } from "@/interfaces/content";
import { useLanguage } from "@/components/LanguageProvider";
import { submitContactMessage } from "@/lib/firebase/contact";
import Section, { glassCard, linkButton, primaryLinkButton } from "@/components/portfolio/Section";

type FieldName = "fullName" | "email" | "message" | "attachment";
type Status = "idle" | "sending" | "success" | "error";

const inputClass = `
  w-full rounded-lg border border-[rgba(var(--color-border-rgba))]
  bg-[rgba(10,10,24,0.7)] px-3 py-2 text-[rgb(var(--primary-rgb))]
  focus:outline-2 focus:outline-[rgb(var(--secondary-rgb))] focus:outline-offset-1
  aria-invalid:border-red-400
`;

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = ".pdf,.jpg,.jpeg,.doc,.docx";

/** Validación rápida en el cliente; el servidor vuelve a validar todo. */
function validate(form: FormData): Partial<Record<FieldName, true>> {
    const errors: Partial<Record<FieldName, true>> = {};
    const name = String(form.get("fullName") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const message = String(form.get("message") ?? "").trim();
    const file = form.get("attachment");
    if (name.length < 2) errors.fullName = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = true;
    if (message.length < 10) errors.message = true;
    if (file instanceof File && file.size > MAX_BYTES) errors.attachment = true;
    return errors;
}

export default function Contact({ profile, socialLinks }: { profile: Profile; socialLinks: SocialLink[] }) {
    const { dictionary } = useLanguage();
    const t = dictionary.contact;
    const formRef = useRef<HTMLFormElement>(null);
    const [status, setStatus] = useState<Status>("idle");
    const [errors, setErrors] = useState<Partial<Record<FieldName, true>>>({});
    const [fileName, setFileName] = useState<string | null>(null);

    async function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        if (String(form.get("website") ?? "").trim() !== "") {
            setStatus("success");
            formRef.current?.reset();
            setFileName(null);
            return;
        }

        const clientErrors = validate(form);
        setErrors(clientErrors);
        if (Object.keys(clientErrors).length) return;

        const fileEntry = form.get("attachment");
        const attachment = fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : undefined;

        setStatus("sending");
        try {
            await submitContactMessage(
                {
                    fullName: String(form.get("fullName") ?? ""),
                    email: String(form.get("email") ?? ""),
                    message: String(form.get("message") ?? "")
                },
                attachment
            );
            setStatus("success");
            formRef.current?.reset();
            setFileName(null);
        } catch (err) {
            const fieldErrors =
                typeof err === "object" && err && "fieldErrors" in err
                    ? (err as { fieldErrors?: Record<string, string> }).fieldErrors
                    : undefined;
            if (fieldErrors) {
                setErrors(Object.fromEntries(Object.keys(fieldErrors).map((k) => [k, true])));
            }
            setStatus("error");
        }
    }

    const fieldError = (name: FieldName) =>
        errors[name] ? (
            <span id={`${name}-error`} className="text-xs text-red-300">
                {t.errors[name]}
            </span>
        ) : null;

    return (
        <Section id="contact" eyebrow={t.eyebrow} title={t.title} description={t.description}>
            <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
                <form ref={formRef} onSubmit={onSubmit} noValidate className={`${glassCard} flex flex-col gap-4 p-6`}>
                    {/* Honeypot anti-spam (oculto para personas) */}
                    <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="flex flex-col gap-1 text-sm">
                            {t.fullName}
                            <input
                                className={inputClass}
                                name="fullName"
                                autoComplete="name"
                                aria-invalid={errors.fullName ? true : undefined}
                                aria-describedby={errors.fullName ? "fullName-error" : undefined}
                            />
                            {fieldError("fullName")}
                        </label>
                        <label className="flex flex-col gap-1 text-sm">
                            {t.email}
                            <input
                                className={inputClass}
                                name="email"
                                type="email"
                                autoComplete="email"
                                aria-invalid={errors.email ? true : undefined}
                                aria-describedby={errors.email ? "email-error" : undefined}
                            />
                            {fieldError("email")}
                        </label>
                    </div>

                    <label className="flex flex-col gap-1 text-sm">
                        {t.message}
                        <textarea
                            className={`${inputClass} min-h-36`}
                            name="message"
                            aria-invalid={errors.message ? true : undefined}
                            aria-describedby={errors.message ? "message-error" : undefined}
                        />
                        {fieldError("message")}
                    </label>

                    <div className="flex flex-col gap-1 text-sm">
                        <label className={`${linkButton} cursor-pointer self-start`}>
                            📎 {fileName ?? t.attachment}
                            <input
                                type="file"
                                name="attachment"
                                accept={ACCEPT}
                                className="sr-only"
                                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
                            />
                        </label>
                        <span className="text-xs text-[rgba(var(--primary-rgb),0.5)]">{t.fileHint}</span>
                        {fieldError("attachment")}
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <button type="submit" className={primaryLinkButton} disabled={status === "sending"}>
                            {status === "sending" ? t.sending : t.send}
                        </button>
                        <p aria-live="polite" className="text-sm">
                            {status === "success" && <span className="text-green-300">{t.success}</span>}
                            {status === "error" && <span className="text-red-300">{t.error}</span>}
                        </p>
                    </div>
                </form>

                <aside className={`${glassCard} flex flex-col gap-4 p-6`}>
                    <p className="text-sm text-[rgba(var(--primary-rgb),0.7)]">{t.orWrite}</p>
                    <a className="font-semibold break-all text-[rgb(var(--secondary-rgb))]" href={`mailto:${profile.email}`}>
                        {profile.email}
                    </a>
                    <ul className="flex flex-col gap-2">
                        {socialLinks.map((link) => (
                            <li key={link.href}>
                                <a className={`${linkButton} w-full`} href={link.href} target="_blank" rel="noreferrer">
                                    {link.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </aside>
            </div>
        </Section>
    );
}
