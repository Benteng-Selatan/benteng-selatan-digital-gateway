import { redirect } from "next/navigation";

import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { publicAdminSession, requireAdminPermission } from "@/lib/auth";
import { getSiteDocument } from "@/lib/cms";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await requireAdminPermission("cms:view");
  if (!session) return redirect("/admin/operasional");
  const document = await getSiteDocument();
  return <AdminDashboard initialData={document.data} initialVersion={document.version} user={publicAdminSession(session)} />;
}
