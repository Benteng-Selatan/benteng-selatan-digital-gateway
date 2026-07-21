import { PageHero } from "@/components/public/PageHero";
import { MapExplorer } from "@/components/public/MapExplorer";
import { getSiteData } from "@/lib/cms";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const data = await getSiteData();
  const locations = data.mapLocations.filter((item) => item.status === "published");
  return (
    <>
      <PageHero eyebrow="Orientasi Wilayah" title="Peta Digital" description="Peta sederhana untuk menemukan fasilitas publik, UMKM, sentra produksi, wisata, dan potensi lokal. Lokasi rumah warga serta penerima bantuan tidak ditampilkan." />
      <section className="section"><div className="container"><MapExplorer locations={locations} /></div></section>
    </>
  );
}
