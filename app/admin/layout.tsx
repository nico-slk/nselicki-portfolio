import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Panel",
    robots: { index: false, follow: false, nocache: true }
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return <div className="min-h-screen w-full px-4 py-10">{children}</div>;
}
