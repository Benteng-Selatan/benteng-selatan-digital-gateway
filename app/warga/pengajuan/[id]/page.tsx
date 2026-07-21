import { notFound, redirect } from "next/navigation";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { RequestDetail } from "@/components/portal/RequestDetail";
import { getCitizenRequest, getCurrentCitizen } from "@/lib/portal";

export const dynamic = "force-dynamic";
export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const citizen = await getCurrentCitizen(); if (!citizen) redirect("/warga/masuk");
  const { id } = await params; const request = await getCitizenRequest(citizen.id, id); if (!request) notFound();
  return <><PortalHeader name={citizen.fullName} /><main className="portal-page"><div className="container"><div className="portal-title"><span className="eyebrow">Detail pengajuan</span><h1>{request.requestNumber}</h1><p>Pantau status dan komunikasikan perbaikan kepada petugas.</p></div><RequestDetail initialRequest={request} /></div></main></>;
}
