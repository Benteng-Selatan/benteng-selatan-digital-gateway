import { redirect } from "next/navigation";
import { CitizenDashboard } from "@/components/portal/CitizenDashboard";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { getCurrentCitizen, listCitizenRequests, listCitizenSubmissions } from "@/lib/portal";

export const dynamic = "force-dynamic";
export default async function CitizenDashboardPage() {
  const citizen = await getCurrentCitizen();
  if (!citizen) redirect("/warga/masuk");
  const [requests, submissions] = await Promise.all([listCitizenRequests(citizen.id), listCitizenSubmissions(citizen.id)]);
  return <><PortalHeader name={citizen.fullName} /><main className="portal-page"><div className="container"><div className="portal-title"><span className="eyebrow">Dashboard warga</span><h1>Selamat datang, {citizen.fullName}</h1><p>Ajukan layanan, kirim kontribusi, dan pantau tindak lanjut kelurahan.</p></div><CitizenDashboard requests={requests} submissions={submissions} /></div></main></>;
}
