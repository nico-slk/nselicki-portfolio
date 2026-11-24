import AdminPanelGate from "@/components/admin/AdminPanelGate";

/** Panel de edición protegido en el cliente por Firebase Auth y en datos por Security Rules. */
export default function AdminPanelPage() {
    return <AdminPanelGate />;
}
