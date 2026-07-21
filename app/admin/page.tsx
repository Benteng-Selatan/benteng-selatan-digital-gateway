import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { isAuthenticated } from "@/lib/auth";
import { getSiteData } from "@/lib/cms";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAuthenticated())) redirect("/admin/login");
  const data = await getSiteData();
  return <AdminDashboard initialData={data} />;
}
