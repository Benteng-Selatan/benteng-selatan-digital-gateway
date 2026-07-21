import { redirect } from "next/navigation";
import { CitizenAuthForm } from "@/components/portal/CitizenAuthForm";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { getCurrentCitizen } from "@/lib/portal";

export const dynamic = "force-dynamic";
export default async function CitizenRegisterPage() {
  if (await getCurrentCitizen()) redirect("/warga");
  return <><PortalHeader /><main className="portal-auth-page"><section className="portal-auth-card wide"><span className="eyebrow">Pendaftaran Warga</span><h1>Buat akun portal</h1><p>Email dipakai sebagai identitas akun. Verifikasi kependudukan tetap dilakukan oleh petugas pada setiap layanan.</p><CitizenAuthForm mode="register" /></section></main></>;
}
