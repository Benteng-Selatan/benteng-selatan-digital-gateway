import { redirect } from "next/navigation";
import { OperationsDashboard } from "@/components/admin/OperationsDashboard";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";
export default async function OperationsPage() {
  if (!(await isAuthenticated())) redirect("/admin/login");
  return <OperationsDashboard />;
}
