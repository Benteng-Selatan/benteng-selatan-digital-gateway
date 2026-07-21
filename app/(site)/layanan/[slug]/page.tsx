import Link from "next/link";
import { ArrowLeft, Clock3, FileCheck2, Info, MapPin, Phone, Route } from "lucide-react";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/public/PageHero";
import { getSiteData } from "@/lib/cms";

export const dynamic = "force-dynamic";

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getSiteData();
  const service = data.services.find((item) => item.slug === slug && item.status === "published");
  if (!service) notFound();

  return (
    <>
      <PageHero eyebrow="Detail Layanan" title={service.name} description={service.shortDescription}>
        <Link href="/layanan" className="back-link"><ArrowLeft size={17} /> Kembali ke daftar layanan</Link>
      </PageHero>
      <section className="section"><div className="container detail-layout">
        <div className="content-stack">
          <article className="content-panel"><span className="icon-box"><FileCheck2 size={22} /></span><h2>Dokumen yang disiapkan</h2><ol className="number-list">{service.requirements.map((item) => <li key={item}>{item}</li>)}</ol></article>
          <article className="content-panel"><span className="icon-box"><Route size={22} /></span><h2>Alur pelayanan</h2><ol className="step-list">{service.steps.map((item, index) => <li key={item}><span>{index + 1}</span><p>{item}</p></li>)}</ol></article>
          {service.note ? <article className="notice warning"><Info size={20} /><div><strong>Catatan</strong><p>{service.note}</p></div></article> : null}
        </div>
        <aside className="detail-sidebar">
          <article className="sidebar-card"><h2>Informasi pelayanan</h2><p><Clock3 size={18} /><span><small>Jam layanan</small>{service.serviceHours}</span></p><p><MapPin size={18} /><span><small>Lokasi</small>{service.location}</span></p><p><Phone size={18} /><span><small>Kontak</small>{service.contact}</span></p></article>
        </aside>
      </div></section>
    </>
  );
}
