import { redirect } from "next/navigation";
import { NewServiceRequestForm } from "@/components/portal/NewServiceRequestForm";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { getCurrentCitizen } from "@/lib/portal";
import { PILOT_SERVICE } from "@/lib/portal-types";

export const dynamic = "force-dynamic";
export default async function NewRequestPage() {
  const citizen = await getCurrentCitizen(); if (!citizen) redirect("/warga/masuk");
  return <><PortalHeader name={citizen.fullName} /><main className="portal-page"><div className="container narrow-container"><div className="portal-title"><span className="eyebrow">Layanan daring pilot</span><h1>{PILOT_SERVICE.name}</h1><p>{PILOT_SERVICE.description}</p></div><div className="notice"><div><strong>Persyaratan awal</strong><ul className="check-list">{PILOT_SERVICE.requirements.map((item) => <li key={item}>{item}</li>)}</ul></div></div><section className="portal-panel"><NewServiceRequestForm citizen={citizen} /></section></div></main></>;
}
