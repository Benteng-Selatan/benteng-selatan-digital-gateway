import { PageHero } from "@/components/public/PageHero";
import { ServiceBrowser } from "@/components/public/ServiceBrowser";
import { getSiteData } from "@/lib/cms";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const data = await getSiteData();
  const services = data.services.filter((item) => item.status === "published");
  return (
    <>
      <PageHero eyebrow="Informasi Pelayanan" title="Layanan Publik" description="Temukan gambaran layanan, dokumen yang perlu disiapkan, alur, jam, lokasi, dan kontak resmi. Pengajuan Surat Keterangan Usaha kini tersedia melalui Portal Warga sebagai layanan daring tahap awal." />
      <section className="section"><div className="container"><div className="notice success service-online-cta"><div><strong>Layanan daring tersedia</strong><p>Warga dapat membuat akun, mengajukan Surat Keterangan Usaha, memantau status, dan berkomunikasi dengan petugas.</p><a className="button button-primary" href="/warga">Buka Portal Warga</a></div></div><ServiceBrowser services={services} /></div></section>
    </>
  );
}
