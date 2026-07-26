import { redirect } from "next/navigation";

import { StaffManagement } from "@/components/admin/StaffManagement";
import { publicAdminSession, requireAdminPermission } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const session = await requireAdminPermission("staff:manage");
  if (!session) return redirect("/admin/login");
  return <StaffManagement user={publicAdminSession(session)} />;
}
