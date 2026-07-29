import { PageHero } from "@/components/public/PageHero";
import { UmkmBrowser } from "@/components/public/UmkmBrowser";
import { getSiteData } from "@/lib/cms";

export const dynamic = "force-dynamic";

export default async function UmkmPage() {
  const data = await getSiteData();
  const items = data.umkm.filter((item) => item.status === "published");
  return (
    <>
      <PageHero eyebrow="Ekonomi Lokal" title="UMKM & Potensi Lokal" description="Temukan usaha dan produk unggulan masyarakat Benteng Selatan beserta lokasi dan kanal pemasarannya." />
      <section className="section"><div className="container"><UmkmBrowser items={items} /></div></section>
    </>
  );
}
