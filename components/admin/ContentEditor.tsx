"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type {
    Education,
    Experience,
    Locale,
    LocalizedContent,
    PortfolioContent,
    Profile,
    Project,
    SocialLink,
    TechItem
} from "@/interfaces/content";
import {
    buttonClass,
    cardClass,
    Field,
    inputClass,
    ListEditor,
    ListField,
    newId,
    primaryButtonClass,
    slugify
} from "@/components/admin/ui";
import type { StoredContactMessage } from "@/lib/contact/service";
import { logout } from "@/lib/firebase/auth";
import { deleteContactMessage, fetchContactMessages } from "@/lib/firebase/contact";
import { savePortfolioContent, seedMockContentToFirestore } from "@/lib/firebase/content";
import { resolveStorageUrl, uploadPortfolioFile, type PortfolioStorageFolder } from "@/lib/firebase/storage";

type Section = "profile" | "projects" | "experience" | "education" | "social" | "messages";

const SECTIONS: { id: Section; label: string }[] = [
    { id: "profile", label: "Perfil" },
    { id: "projects", label: "Proyectos" },
    { id: "experience", label: "Experiencia" },
    { id: "education", label: "Formación" },
    { id: "social", label: "Redes" },
    { id: "messages", label: "Mensajes" }
];

const techNames = (items: TechItem[]) => items.map((t) => t.name);
const toTech = (names: string[]): TechItem[] => names.map((name) => ({ name, icon: slugify(name) }));

/** Asigna `order` según la posición en la lista antes de guardar. */
function withOrder<T extends { order?: number }>(items: T[]): T[] {
    return items.map((item, i) => ({ ...item, order: i + 1 }));
}

type Status = { kind: "idle" } | { kind: "saving" } | { kind: "saved"; at: string } | { kind: "error"; messages: string[] };

function StorageUploadButton({
    folder,
    accept,
    label,
    onUploaded
}: {
    folder: PortfolioStorageFolder;
    accept: string;
    label: string;
    onUploaded: (result: { path: string; url: string }) => void;
}) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    return (
        <div className="flex flex-col gap-1">
            <label className={`${buttonClass} inline-flex cursor-pointer items-center self-start text-xs`}>
                {uploading ? "Subiendo…" : label}
                <input
                    type="file"
                    accept={accept}
                    className="sr-only"
                    disabled={uploading}
                    onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (!file) return;
                        setUploading(true);
                        setError(null);
                        try {
                            onUploaded(await uploadPortfolioFile(folder, file));
                        } catch (err) {
                            setError(err instanceof Error ? err.message : "Error al subir archivo");
                        } finally {
                            setUploading(false);
                        }
                    }}
                />
            </label>
            {error && <span className="text-xs text-red-300">{error}</span>}
        </div>
    );
}

export default function ContentEditor({
    initialContent,
    initialSource = "firestore",
    userEmail
}: {
    initialContent: PortfolioContent;
    initialSource?: "firestore" | "mock";
    userEmail?: string;
}) {
    const router = useRouter();
    const [content, setContent] = useState(initialContent);
    const [source, setSource] = useState<"firestore" | "mock">(initialSource);
    const [locale, setLocale] = useState<Locale>("es");
    const [section, setSection] = useState<Section>("profile");
    const [dirty, setDirty] = useState(false);
    const [status, setStatus] = useState<Status>({ kind: "idle" });
    const [messages, setMessages] = useState<StoredContactMessage[]>([]);
    const [messagesLoading, setMessagesLoading] = useState(false);

    useEffect(() => {
        if (!dirty) return;
        const warn = (e: BeforeUnloadEvent) => e.preventDefault();
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [dirty]);

    async function loadMessages() {
        setMessagesLoading(true);
        try {
            setMessages(await fetchContactMessages());
        } catch (err) {
            console.error("[admin] Error al listar mensajes", err);
        } finally {
            setMessagesLoading(false);
        }
    }

    function selectSection(next: Section) {
        setSection(next);
        if (next === "messages") {
            void loadMessages();
        }
    }

    const current = content.locales[locale];

    function updateLocale(patch: Partial<LocalizedContent>) {
        setContent((c) => ({ ...c, locales: { ...c.locales, [locale]: { ...c.locales[locale], ...patch } } }));
        setDirty(true);
    }
    const updateProfile = (patch: Partial<Profile>) => updateLocale({ profile: { ...current.profile, ...patch } });

    async function save() {
        setStatus({ kind: "saving" });
        const payload: PortfolioContent = {
            ...content,
            locales: Object.fromEntries(
                (Object.keys(content.locales) as Locale[]).map((l) => {
                    const lc = content.locales[l];
                    return [
                        l,
                        {
                            ...lc,
                            projects: withOrder(lc.projects),
                            experience: withOrder(lc.experience),
                            education: withOrder(lc.education)
                        }
                    ];
                })
            ) as PortfolioContent["locales"]
        };
        try {
            const saved = await savePortfolioContent(payload);
            setContent(saved);
            setSource("firestore");
            setDirty(false);
            setStatus({ kind: "saved", at: new Date(saved.updatedAt).toLocaleString() });
        } catch (err) {
            const validationErrors =
                typeof err === "object" && err && "validationErrors" in err
                    ? (err as { validationErrors?: string[] }).validationErrors
                    : undefined;
            setStatus({
                kind: "error",
                messages: validationErrors ?? [err instanceof Error ? err.message : "No se pudo guardar en Firestore"]
            });
        }
    }

    async function seedInitialContent() {
        setStatus({ kind: "saving" });
        try {
            const saved = await seedMockContentToFirestore();
            setContent(saved);
            setSource("firestore");
            setDirty(false);
            setStatus({ kind: "saved", at: new Date(saved.updatedAt).toLocaleString() });
        } catch (err) {
            setStatus({
                kind: "error",
                messages: [err instanceof Error ? err.message : "No se pudo inicializar Firestore"]
            });
        }
    }

    async function handleLogout() {
        if (dirty && !window.confirm("Hay cambios sin guardar. ¿Salir igual?")) return;
        await logout();
        setDirty(false);
        router.replace("/admin");
    }

    return (
        <main className="mx-auto flex w-full max-w-5xl flex-col gap-6">
            <header className={`${cardClass} sticky top-4 z-20 flex flex-wrap items-center justify-between gap-3 p-4`}>
                <div>
                    <h1 className="text-xl font-extrabold">Panel de contenido</h1>
                    <p className="text-xs text-[rgba(var(--primary-rgb),0.55)]">
                        {userEmail ? `${userEmail} · ` : ""}
                        Última actualización: {new Date(content.updatedAt).toLocaleString()}
                        {dirty && " · cambios sin guardar"}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <a className={buttonClass} href="/" target="_blank" rel="noreferrer">
                        Ver sitio
                    </a>
                    <button type="button" className={buttonClass} onClick={handleLogout}>
                        Cerrar sesión
                    </button>
                    <button
                        type="button"
                        className={primaryButtonClass}
                        onClick={save}
                        disabled={!dirty || status.kind === "saving"}
                    >
                        {status.kind === "saving" ? "Guardando..." : "Guardar cambios"}
                    </button>
                </div>
            </header>

            {source === "mock" && (
                <div className={`${cardClass} flex flex-wrap items-center justify-between gap-3 border-yellow-400/30 p-4 text-sm`}>
                    <p className="text-yellow-200">
                        Firestore todavía no tiene el documento <code>portfolio/content</code>. Estás viendo los datos mock iniciales.
                    </p>
                    <button type="button" className={primaryButtonClass} onClick={seedInitialContent} disabled={status.kind === "saving"}>
                        Inicializar Firestore con datos actuales
                    </button>
                </div>
            )}

            {status.kind === "saved" && <p className="text-sm text-green-300">Guardado en Firestore ({status.at}).</p>}
            {status.kind === "error" && (
                <ul role="alert" className="list-disc pl-5 text-sm text-red-300">
                    {status.messages.map((m) => (
                        <li key={m}>{m}</li>
                    ))}
                </ul>
            )}

            <nav className="flex flex-wrap items-center gap-2" aria-label="Secciones">
                {section !== "social" && section !== "messages" && (
                    <div className="mr-4 flex gap-1" role="group" aria-label="Idioma">
                        {(["es", "en"] as Locale[]).map((l) => (
                            <button
                                key={l}
                                type="button"
                                className={`${buttonClass} ${locale === l ? "bg-[rgba(255,252,221,0.12)] font-bold" : ""}`}
                                onClick={() => setLocale(l)}
                                aria-pressed={locale === l}
                            >
                                {l.toUpperCase()}
                            </button>
                        ))}
                    </div>
                )}
                {SECTIONS.map((s) => (
                    <button
                        key={s.id}
                        type="button"
                        className={`${buttonClass} ${section === s.id ? "text-[rgb(var(--secondary-rgb))]" : ""}`}
                        onClick={() => selectSection(s.id)}
                        aria-pressed={section === s.id}
                    >
                        {s.label}
                    </button>
                ))}
            </nav>

            {/* key fuerza a remontar los campos al cambiar de idioma */}
            <section key={`${locale}-${section}`} className="flex flex-col gap-4">
                {section === "profile" && (
                    <div className={`${cardClass} grid gap-4 p-4 md:grid-cols-2`}>
                        <Field label="Nombre completo" value={current.profile.fullName} onChange={(v) => updateProfile({ fullName: v })} />
                        <Field label="Rol" value={current.profile.role} onChange={(v) => updateProfile({ role: v })} />
                        <Field label="Titular" value={current.profile.headline} onChange={(v) => updateProfile({ headline: v })} />
                        <Field label="Ubicación" value={current.profile.location} onChange={(v) => updateProfile({ location: v })} />
                        <Field label="Email" type="email" value={current.profile.email} onChange={(v) => updateProfile({ email: v })} />
                        <ListField label="Stack" values={current.profile.stack} onChange={(v) => updateProfile({ stack: v })} hint="Separado por comas" />
                        <div className="flex flex-col gap-2">
                            <Field label="Avatar (URL o ruta Storage)" value={current.profile.avatarUrl ?? ""} onChange={(v) => updateProfile({ avatarUrl: v })} />
                            <StorageUploadButton
                                folder="media"
                                accept="image/*"
                                label="Subir avatar a Storage"
                                onUploaded={({ path }) => updateProfile({ avatarUrl: path })}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Field label="CV (URL o ruta Storage)" value={current.profile.cvUrl ?? ""} onChange={(v) => updateProfile({ cvUrl: v })} />
                            <StorageUploadButton
                                folder="cv"
                                accept=".pdf"
                                label="Subir CV (PDF) a Storage"
                                onUploaded={({ path }) => updateProfile({ cvUrl: path })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <Field label="Sobre mí" multiline value={current.profile.about} onChange={(v) => updateProfile({ about: v })} />
                        </div>
                    </div>
                )}

                {section === "projects" && (
                    <ListEditor<Project>
                        items={current.projects}
                        onChange={(projects) => updateLocale({ projects })}
                        keyOf={(p) => p.id}
                        title={(p) => p.name}
                        addLabel="Agregar proyecto"
                        create={() => ({
                            id: newId("proj"),
                            name: "",
                            shortDescription: "",
                            fullDescription: "",
                            technologies: [],
                            screenshots: [],
                            githubUrl: ""
                        })}
                        render={(p, update) => (
                            <>
                                <Field label="Nombre" value={p.name} onChange={(v) => update({ name: v })} />
                                <Field label="Descripción corta" value={p.shortDescription} onChange={(v) => update({ shortDescription: v })} />
                                <Field label="GitHub (URL)" value={p.githubUrl} onChange={(v) => update({ githubUrl: v })} />
                                <Field label="Demo (URL)" value={p.demoUrl ?? ""} onChange={(v) => update({ demoUrl: v })} />
                                <ListField label="Tecnologías" values={techNames(p.technologies)} onChange={(v) => update({ technologies: toTech(v) })} hint="Separadas por comas" />
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={p.featured === true} onChange={(e) => update({ featured: e.target.checked })} />
                                    Destacado
                                </label>
                                <div className="md:col-span-2">
                                    <Field label="Descripción completa" multiline value={p.fullDescription} onChange={(v) => update({ fullDescription: v })} />
                                </div>
                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <ListField
                                        key={`${p.id}-${p.screenshots.length}`}
                                        label="Capturas (una URL o ruta Storage por línea)"
                                        separator={"\n"}
                                        values={p.screenshots}
                                        onChange={(v) => update({ screenshots: v })}
                                    />
                                    <StorageUploadButton
                                        folder="media"
                                        accept="image/*"
                                        label="Subir captura a Storage"
                                        onUploaded={({ path }) => update({ screenshots: [...p.screenshots, path] })}
                                    />
                                </div>
                            </>
                        )}
                    />
                )}

                {section === "experience" && (
                    <ListEditor<Experience>
                        items={current.experience}
                        onChange={(experience) => updateLocale({ experience })}
                        keyOf={(e) => e.id}
                        title={(e) => [e.role, e.company].filter(Boolean).join(" · ")}
                        addLabel="Agregar experiencia"
                        create={() => ({ id: newId("exp"), company: "", role: "", year: "", period: "", description: "", technologies: [] })}
                        render={(e, update) => (
                            <>
                                <Field label="Empresa" value={e.company} onChange={(v) => update({ company: v })} />
                                <Field label="Rol" value={e.role} onChange={(v) => update({ role: v })} />
                                <Field label="Año" value={e.year} onChange={(v) => update({ year: v })} />
                                <Field label="Período" value={e.period} onChange={(v) => update({ period: v })} placeholder="2023 — Actualidad" />
                                <div className="md:col-span-2">
                                    <ListField label="Tecnologías" values={techNames(e.technologies)} onChange={(v) => update({ technologies: toTech(v) })} hint="Separadas por comas" />
                                </div>
                                <div className="md:col-span-2">
                                    <Field
                                        label="Descripción"
                                        multiline
                                        value={e.description}
                                        onChange={(v) => update({ description: v })}
                                        hint="Una línea por logro: cada línea se muestra como un ítem de lista."
                                    />
                                </div>
                            </>
                        )}
                    />
                )}

                {section === "education" && (
                    <ListEditor<Education>
                        items={current.education}
                        onChange={(education) => updateLocale({ education })}
                        keyOf={(e) => e.id}
                        title={(e) => [e.title, e.institution].filter(Boolean).join(" · ")}
                        addLabel="Agregar formación"
                        create={() => ({ id: newId("edu"), title: "", institution: "" })}
                        render={(e, update) => (
                            <>
                                <Field label="Título" value={e.title} onChange={(v) => update({ title: v })} />
                                <Field label="Institución" value={e.institution ?? ""} onChange={(v) => update({ institution: v })} />
                                <Field label="Año (opcional)" value={e.year ?? ""} onChange={(v) => update({ year: v })} />
                                <Field label="Período (opcional)" value={e.period ?? ""} onChange={(v) => update({ period: v })} />
                                <label className="flex flex-col gap-1 text-sm">
                                    <span className="text-[rgba(var(--primary-rgb),0.75)]">Tipo</span>
                                    <select
                                        className={inputClass}
                                        value={e.kind ?? ""}
                                        onChange={(ev) => update({ kind: (ev.target.value || undefined) as Education["kind"] })}
                                    >
                                        <option value="">(sin tipo)</option>
                                        <option value="degree">Formación universitaria</option>
                                        <option value="bootcamp">Bootcamp</option>
                                        <option value="course">Curso</option>
                                        <option value="certification">Certificación</option>
                                    </select>
                                </label>
                                <div className="flex flex-col gap-2">
                                    <Field
                                        label="Diploma: ruta en Firebase Storage"
                                        value={e.diplomaPath ?? ""}
                                        onChange={(v) => update({ diplomaPath: v })}
                                        placeholder="diplomas/mi-certificado.pdf"
                                        hint="PDF, JPG, PNG o WEBP. Tiene prioridad sobre la URL externa."
                                    />
                                    <StorageUploadButton
                                        folder="diplomas"
                                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                                        label="Subir diploma a Storage"
                                        onUploaded={({ path }) => update({ diplomaPath: path })}
                                    />
                                </div>
                                <Field label="Diploma: URL externa (opcional)" value={e.diplomaUrl ?? ""} onChange={(v) => update({ diplomaUrl: v })} />
                                <div className="md:col-span-2">
                                    <Field label="Descripción" multiline value={e.description ?? ""} onChange={(v) => update({ description: v })} />
                                </div>
                            </>
                        )}
                    />
                )}

                {section === "social" && (
                    <>
                        <p className="text-sm text-[rgba(var(--primary-rgb),0.6)]">Las redes son compartidas por ambos idiomas.</p>
                        <ListEditor<SocialLink>
                            items={content.socialLinks}
                            onChange={(socialLinks) => {
                                setContent((c) => ({ ...c, socialLinks }));
                                setDirty(true);
                            }}
                            keyOf={(_, i) => `social-${i}`}
                            title={(s) => s.label}
                            addLabel="Agregar red"
                            create={() => ({ label: "", href: "", icon: "" })}
                            render={(s, update) => (
                                <>
                                    <Field label="Etiqueta" value={s.label} onChange={(v) => update({ label: v })} />
                                    <Field label="URL" value={s.href} onChange={(v) => update({ href: v })} placeholder="https://... o mailto:..." />
                                    <Field label="Ícono" value={s.icon} onChange={(v) => update({ icon: v })} hint="github, linkedin, mail..." />
                                </>
                            )}
                        />
                    </>
                )}

                {section === "messages" && (
                    <div className="flex flex-col gap-4">
                        {messagesLoading && <p className="text-sm text-[rgba(var(--primary-rgb),0.65)]">Cargando mensajes…</p>}
                        {!messagesLoading && messages.length === 0 && (
                            <p className={`${cardClass} p-6 text-sm text-[rgba(var(--primary-rgb),0.65)]`}>
                                No hay mensajes recibidos en Firestore todavía.
                            </p>
                        )}
                        {messages.map((msg) => (
                            <article key={msg.id} className={`${cardClass} flex flex-col gap-2 p-5`}>
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <h2 className="font-bold">{msg.fullName}</h2>
                                        <a className="text-xs text-[rgb(var(--secondary-rgb))]" href={`mailto:${msg.email}`}>
                                            {msg.email}
                                        </a>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-[rgba(var(--primary-rgb),0.55)]">
                                            {msg.receivedAt ? new Date(msg.receivedAt).toLocaleString() : ""}
                                        </span>
                                        <button
                                            type="button"
                                            className={`${buttonClass} text-red-300`}
                                            onClick={async () => {
                                                if (!window.confirm("¿Eliminar este mensaje?")) return;
                                                await deleteContactMessage(msg);
                                                setMessages((prev) => prev.filter((m) => m.id !== msg.id));
                                            }}
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                                <p className="whitespace-pre-line text-sm text-[rgba(var(--primary-rgb),0.85)]">{msg.message}</p>
                                {msg.attachmentPath && msg.attachment && (
                                    <button
                                        type="button"
                                        className={`${buttonClass} self-start text-xs`}
                                        onClick={async () => {
                                            const url = await resolveStorageUrl(msg.attachmentPath!);
                                            if (url) window.open(url, "_blank", "noopener,noreferrer");
                                        }}
                                    >
                                        📎 {msg.attachment.name}
                                    </button>
                                )}
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
