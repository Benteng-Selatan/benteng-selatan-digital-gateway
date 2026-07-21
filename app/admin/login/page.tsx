import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await isAuthenticated()) redirect("/admin");
  return <main className="login-page"><LoginForm /></main>;
}
