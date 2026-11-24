"use client";

import { useState, type ReactNode } from "react";

/** Piezas de UI compartidas por el login y el editor del panel. */

export const inputClass = `
  w-full rounded-lg border border-[rgba(var(--color-border-rgba))]
  bg-[rgba(10,10,24,0.7)] px-3 py-2 text-[rgb(var(--primary-rgb))]
  placeholder:text-[rgba(var(--primary-rgb),0.35)]
  focus:outline-2 focus:outline-[rgb(var(--secondary-rgb))] focus:outline-offset-1
`;

export const buttonClass = `
  rounded-lg border border-[rgba(var(--color-border-rgba))] px-4 py-2 text-sm
  transition-colors duration-150 hover:bg-[rgba(255,252,221,0.08)]
  disabled:cursor-not-allowed disabled:opacity-50
`;

export const primaryButtonClass = `
  rounded-lg bg-[rgb(var(--secondary-rgb))] px-4 py-2 text-sm font-semibold text-[#0a0a18]
  transition-opacity duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50
`;

export const cardClass = `
  rounded-xl border border-[rgba(var(--color-border-rgba))]
  bg-[rgba(10,10,24,0.68)] shadow-(--shadow-glow-rgba) backdrop-blur-[18px]
`;

interface FieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    multiline?: boolean;
    placeholder?: string;
    type?: string;
    hint?: string;
}

export function Field({ label, value, onChange, multiline, placeholder, type = "text", hint }: FieldProps) {
    return (
        <label className="flex flex-col gap-1 text-sm">
            <span className="text-[rgba(var(--primary-rgb),0.75)]">{label}</span>
            {multiline ? (
                <textarea
                    className={`${inputClass} min-h-28`}
                    value={value}
                    placeholder={placeholder}
                    onChange={(e) => onChange(e.target.value)}
                />
            ) : (
                <input
                    className={inputClass}
                    type={type}
                    value={value}
                    placeholder={placeholder}
                    onChange={(e) => onChange(e.target.value)}
                />
            )}
            {hint && <span className="text-xs text-[rgba(var(--primary-rgb),0.45)]">{hint}</span>}
        </label>
    );
}

/**
 * Campo de texto que representa una lista (separada por comas o saltos de línea).
 * Mantiene el texto tal cual se escribe y emite la lista parseada.
 */
export function ListField({
    label,
    values,
    onChange,
    separator = ",",
    hint
}: {
    label: string;
    values: string[];
    onChange: (values: string[]) => void;
    separator?: "," | "\n";
    hint?: string;
}) {
    const joiner = separator === "," ? ", " : "\n";
    const [text, setText] = useState(values.join(joiner));
    const parse = (t: string) =>
        t
            .split(separator === "," ? /[,\n]/ : /\n/)
            .map((s) => s.trim())
            .filter(Boolean);

    return (
        <Field
            label={label}
            value={text}
            multiline={separator === "\n"}
            hint={hint}
            onChange={(t) => {
                setText(t);
                onChange(parse(t));
            }}
        />
    );
}

interface ListEditorProps<T> {
    items: T[];
    onChange: (items: T[]) => void;
    create: () => T;
    title: (item: T, index: number) => string;
    render: (item: T, update: (patch: Partial<T>) => void) => ReactNode;
    addLabel: string;
    keyOf: (item: T, index: number) => string;
}

/** Editor genérico de listas: agregar, quitar y reordenar elementos. */
export function ListEditor<T>({ items, onChange, create, title, render, addLabel, keyOf }: ListEditorProps<T>) {
    // Los elementos recién agregados se muestran expandidos.
    const [openKeys, setOpenKeys] = useState<Set<string>>(() => new Set());

    const move = (from: number, to: number) => {
        if (to < 0 || to >= items.length) return;
        const next = [...items];
        const [it] = next.splice(from, 1);
        next.splice(to, 0, it);
        onChange(next);
    };

    return (
        <div className="flex flex-col gap-4">
            {items.map((item, index) => (
                <details key={keyOf(item, index)} className={`${cardClass} p-4`} open={items.length <= 1 || openKeys.has(keyOf(item, index))}>
                    <summary className="flex cursor-pointer items-center justify-between gap-2 font-semibold">
                        <span>
                            {index + 1}. {title(item, index) || "(sin título)"}
                        </span>
                        <span className="flex gap-1" onClick={(e) => e.preventDefault()}>
                            <button type="button" className={buttonClass} onClick={() => move(index, index - 1)} aria-label="Subir">
                                ↑
                            </button>
                            <button type="button" className={buttonClass} onClick={() => move(index, index + 1)} aria-label="Bajar">
                                ↓
                            </button>
                            <button
                                type="button"
                                className={`${buttonClass} text-red-300`}
                                onClick={() => {
                                    if (confirmRemoval()) onChange(items.filter((_, i) => i !== index));
                                }}
                                aria-label="Eliminar"
                            >
                                Eliminar
                            </button>
                        </span>
                    </summary>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                        {render(item, (patch) => onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it))))}
                    </div>
                </details>
            ))}
            <button type="button" className={`${buttonClass} self-start`} onClick={() => {
                    const item = create();
                    setOpenKeys((keys) => new Set(keys).add(keyOf(item, items.length)));
                    onChange([...items, item]);
                }}>
                + {addLabel}
            </button>
        </div>
    );
}

function confirmRemoval(): boolean {
    // El panel es de uso exclusivo del dueño; un confirm nativo es suficiente.
    return typeof window === "undefined" ? true : window.confirm("¿Eliminar este elemento?");
}

export function newId(prefix: string): string {
    return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function slugify(value: string): string {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "");
}
