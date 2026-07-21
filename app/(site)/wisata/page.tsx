import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { PageHero } from "@/components/public/PageHero";
import { getSiteData } from "@/lib/cms";

export const dynamic = "force-dynamic";

export default async function StoriesPage() {
  const data = await getSiteData();
  const stories = data.stories.filter((item) => item.status === "published");
  return (
    <>
      <PageHero eyebrow="Dokumentasi Wilayah" title="Wisata & Kearifan Lokal" description="Cerita, budaya, potensi wisata, dan dokumentasi kegiatan masyarakat yang telah diperiksa sumber serta izin publikasinya." />
      <section className="section"><div className="container card-grid card-grid-2">{stories.map((story) => <article className="story-card vertical" key={story.id}><img src={story.image || "/images/story-placeholder.svg"} alt={story.title} /><div><span className="category-label">{story.category}</span><h2>{story.title}</h2><p>{story.excerpt}</p><small className="card-meta"><MapPin size={15} /> {story.generalLocation || "Lokasi umum belum diisi"}</small><Link href={`/wisata/${story.slug}`} className="text-link">Baca selengkapnya <ArrowRight size={17} /></Link></div></article>)}</div></section>
    </>
  );
}
