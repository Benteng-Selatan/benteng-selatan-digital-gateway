import { HeartHandshake, Info, Route, ShieldCheck } from "lucide-react";
import { PageHero } from "@/components/public/PageHero";
import { getSiteData } from "@/lib/cms";

export const dynamic = "force-dynamic";

export default async function SocialPage() {
  const data = await getSiteData();
  const stats = data.socialStatistics.filter((item) => item.status === "published");
  return (
    <>
      <PageHero eyebrow="Informasi Sosial" title="Kesejahteraan Sosial" description={data.socialContent.intro} />
      <section className="section"><div className="container">
        <article className="notice success"><ShieldCheck size={22} /><div><strong>Perlindungan data pribadi</strong><p>{data.socialContent.privacyNote}</p></div></article>
        <div className="social-stat-grid">{stats.map((item) => <article key={item.id}><span className="icon-box"><HeartHandshake size={21} /></span><strong>{item.value.toLocaleString("id-ID")}</strong><h2>{item.category}</h2><p>{item.description}</p><small>{item.year ? `Tahun ${item.year}` : "Tahun belum diisi"}{item.source ? ` · Sumber: ${item.source}` : ""}</small></article>)}</div>
      </div></section>
      <section className="section section-tinted"><div className="container two-column-content">
        <article className="content-panel"><span className="icon-box"><Info size={22} /></span><h2>Hambatan akses layanan</h2><ul className="check-list">{data.socialContent.accessBarriers.map((item) => <li key={item}>{item}</li>)}</ul></article>
        <article className="content-panel"><span className="icon-box"><Route size={22} /></span><h2>Alur memperoleh informasi</h2><ol className="step-list">{data.socialContent.serviceFlow.map((item, index) => <li key={item}><span>{index + 1}</span><p>{item}</p></li>)}</ol></article>
        <article className="content-panel"><h2>Rekomendasi umum</h2><ul className="check-list">{data.socialContent.recommendations.map((item) => <li key={item}>{item}</li>)}</ul></article>
        <article className="content-panel"><h2>Kontak rujukan</h2><p>{data.socialContent.referralContact}</p></article>
      </div></section>
    </>
  );
}
