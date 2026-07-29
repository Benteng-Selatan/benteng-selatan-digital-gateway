import Link from "next/link";
import { ArrowLeft, Clock3, ExternalLink, MapPin, Phone } from "lucide-react";
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
      <PageHero eyebrow="Informasi Layanan" title={service.name} description={service.shortDescription}>
        <Link href="/layanan" className="back-link"><ArrowLeft size={17} /> Kembali ke daftar layanan</Link>
      </PageHero>
      <section className="section"><div className="container detail-layout">
        <div className="content-stack">
          <article className="content-panel service-detail-besti">
            <span className="eyebrow">Prosedur resmi</span>
            <h2>Lanjutkan pengurusan melalui BESTI</h2>
            <p>Persyaratan dan tahapan dapat berubah mengikuti ketentuan pelayanan. Gunakan BESTI agar informasi dan proses pengajuan yang diterima tetap terbaru.</p>
            <a href={data.site.bestiUrl} className="button button-primary" target="_blank" rel="noreferrer">Buka BESTI <ExternalLink size={18} /></a>
          </article>
        </div>
        <aside className="detail-sidebar">
          <article className="sidebar-card"><h2>Informasi pelayanan</h2><p><Clock3 size={18} /><span><small>Jam layanan</small>{service.serviceHours || data.contact.serviceHours}</span></p><p><MapPin size={18} /><span><small>Lokasi</small>{service.location || data.contact.address}</span></p><p><Phone size={18} /><span><small>Kontak</small>{data.contact.phone || service.contact || "Kontak resmi belum tersedia"}</span></p></article>
        </aside>
      </div></section>
    </>
  );
}
