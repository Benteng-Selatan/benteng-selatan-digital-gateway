import { redirect } from "next/navigation";

import { OperationsDashboard } from "@/components/admin/OperationsDashboard";
import { publicAdminSession, requireAdminPermission } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
  const session = await requireAdminPermission("operations:view");
  if (!session) return redirect("/admin/login");
  return <OperationsDashboard user={publicAdminSession(session)} />;
}
