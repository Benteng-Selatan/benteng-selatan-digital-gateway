import { Building2, Landmark, Leaf, Users } from "lucide-react";
import { PageHero } from "@/components/public/PageHero";
import { getSiteData } from "@/lib/cms";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const data = await getSiteData();
  return (
    <>
      <PageHero eyebrow="Profil Kelurahan" title={data.profile.heading} description="Gambaran ringkas mengenai wilayah, masyarakat, potensi, fasilitas, dan pemerintahan Kelurahan Benteng Selatan." />
      <section className="section">
        <div className="container split-feature align-start">
          <div className="feature-image sticky-image"><img src={data.profile.image} alt="Profil wilayah Benteng Selatan" /></div>
          <div className="content-stack">
            <article className="content-panel"><span className="icon-box"><Landmark size={22} /></span><h2>Tentang wilayah</h2><p>{data.profile.description}</p></article>
            <article className="content-panel"><span className="icon-box"><Users size={22} /></span><h2>Gambaran masyarakat</h2><p>{data.profile.communityOverview}</p></article>
            <article className="content-panel"><span className="icon-box"><Leaf size={22} /></span><h2>Potensi wilayah</h2><ul className="check-list">{data.profile.potentials.map((item) => <li key={item}>{item}</li>)}</ul></article>
            <article className="content-panel"><span className="icon-box"><Building2 size={22} /></span><h2>Fasilitas utama</h2><ul className="check-list">{data.profile.facilities.map((item) => <li key={item}>{item}</li>)}</ul></article>
            <article className="content-panel"><h2>Pemerintahan kelurahan</h2><p><strong>Pimpinan:</strong> {data.profile.leaderName}</p><p>{data.profile.governmentDescription}</p></article>
          </div>
        </div>
      </section>
    </>
  );
}
