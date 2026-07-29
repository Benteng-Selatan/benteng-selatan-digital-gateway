import { ExternalLink, Info } from "lucide-react";
import { PageHero } from "@/components/public/PageHero";
import { ServiceBrowser } from "@/components/public/ServiceBrowser";
import { getSiteData } from "@/lib/cms";

export const dynamic = "force-dynamic";

const primaryServiceOrder = [
  "surat-keterangan-tidak-mampu",
  "surat-keterangan-usaha",
  "surat-keterangan-domisili",
  "surat-keterangan-asal-usul",
  "surat-keterangan-ahli-waris",
  "surat-keterangan-belum-mendapatkan-buku-nikah",
  "surat-keterangan-pekerjaan",
  "surat-pengantar-keterangan-hilang",
  "surat-keterangan-orang-yang-sama",
  "surat-keterangan-domisili-kantor-organisasi",
];

export default async function ServicesPage() {
  const data = await getSiteData();
  const services = data.services
    .filter((item) => item.status === "published" && item.featured)
    .sort((left, right) => {
      const leftIndex = primaryServiceOrder.indexOf(left.slug);
      const rightIndex = primaryServiceOrder.indexOf(right.slug);
      return (leftIndex < 0 ? 999 : leftIndex) - (rightIndex < 0 ? 999 : rightIndex);
    })
    .slice(0, 10);
  return (
    <>
      <PageHero eyebrow="Pusat Layanan Warga" title="Layanan Kelurahan Benteng Selatan" description="Kenali layanan yang paling sering dibutuhkan warga. Persyaratan, prosedur lengkap, dan pengajuan dilakukan melalui aplikasi BESTI." />
      <section className="section"><div className="container">
        <div className="service-gateway-panel">
          <div>
            <span className="eyebrow">Layanan administrasi daring</span>
            <h2>Pengurusan terpusat melalui BESTI</h2>
            <p>Website ini membantu warga menemukan jenis layanan. Untuk melihat persyaratan terbaru, mengikuti prosedur, dan mengajukan layanan, lanjutkan ke BESTI.</p>
          </div>
          <a className="button button-primary" href={data.site.bestiUrl} target="_blank" rel="noreferrer">Buka BESTI <ExternalLink size={18} /></a>
        </div>
        <div className="notice service-list-note"><Info size={20} /><div><strong>Daftar layanan utama</strong><p>Layanan lain tetap dapat dikonsultasikan kepada petugas kelurahan atau dilihat langsung melalui BESTI.</p></div></div>
        <ServiceBrowser services={services} bestiUrl={data.site.bestiUrl} />
      </div></section>
    </>
  );
}
