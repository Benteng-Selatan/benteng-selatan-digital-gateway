import { redirect } from "next/navigation";

import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { publicAdminSession, requireAdminPermission } from "@/lib/auth";
import { getSiteData } from "@/lib/cms";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await requireAdminPermission("cms:view");
  if (!session) return redirect("/admin/operasional");
  const data = await getSiteData();
  return <AdminDashboard initialData={data} user={publicAdminSession(session)} />;
}
