import { redirect } from "next/navigation";
import { NewContributionForm } from "@/components/portal/NewContributionForm";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { getCurrentCitizen } from "@/lib/portal";
import { CONTRIBUTION_TYPES, type ContributionType } from "@/lib/portal-types";

export const dynamic = "force-dynamic";
export default async function NewContributionPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const citizen = await getCurrentCitizen(); if (!citizen) redirect("/warga/masuk");
  const query = await searchParams; const selected = CONTRIBUTION_TYPES.includes(query.type as ContributionType) ? query.type as ContributionType : "umkm";
  return <><PortalHeader name={citizen.fullName} /><main className="portal-page"><div className="container narrow-container"><div className="portal-title"><span className="eyebrow">Kontribusi warga</span><h1>Ajukan data untuk portal publik</h1><p>Petugas akan memeriksa data sebelum menerbitkannya pada menu UMKM, wisata, atau peta.</p></div><section className="portal-panel"><NewContributionForm initialType={selected} /></section></div></main></>;
}
