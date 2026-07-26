import { redirect } from "next/navigation";

import { AuditLogViewer } from "@/components/admin/AuditLogViewer";
import { publicAdminSession, requireAdminPermission } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const session = await requireAdminPermission("audit:view");
  if (!session) return redirect("/admin/login");
  return <AuditLogViewer user={publicAdminSession(session)} />;
}
