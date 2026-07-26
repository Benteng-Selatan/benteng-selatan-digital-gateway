import { redirect } from "next/navigation";

import { LoginForm } from "@/components/admin/LoginForm";
import { getAdminSession } from "@/lib/auth";
import { hasAdminPermission } from "@/lib/admin-permissions";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) {
    if (hasAdminPermission(session.role, "cms:view")) redirect("/admin");
    redirect("/admin/operasional");
  }
  return <main className="login-page"><LoginForm /></main>;
}
