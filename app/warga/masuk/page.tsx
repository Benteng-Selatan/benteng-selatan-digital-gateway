import { redirect } from "next/navigation";
import { CitizenAuthForm } from "@/components/portal/CitizenAuthForm";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { getCurrentCitizen } from "@/lib/portal";

export const dynamic = "force-dynamic";
export default async function CitizenLoginPage() {
  if (await getCurrentCitizen()) redirect("/warga");
  return <><PortalHeader /><main className="portal-auth-page"><section className="portal-auth-card"><span className="eyebrow">Portal Warga</span><h1>Masuk ke akun warga</h1><p>Pantau pengajuan surat dan kontribusi data lokal dalam satu tempat.</p><CitizenAuthForm mode="login" /></section></main></>;
}
