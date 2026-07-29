import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { PageHero } from "@/components/public/PageHero";
import { StoryBrowser } from "@/components/public/StoryBrowser";
import { getSiteData } from "@/lib/cms";

export const dynamic = "force-dynamic";

function timestamp(value: string) {
  const time = value ? new Date(`${value}T00:00:00`).getTime() : 0;
  return Number.isNaN(time) ? 0 : time;
}

function displayDate(value: string) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export default async function StoriesPage() {
  const data = await getSiteData();
  const stories = data.stories
    .filter((item) => item.status === "published")
    .sort((a, b) => timestamp(b.publishedAt) - timestamp(a.publishedAt));
  const featured = stories.find((story) => story.featured) || stories[0];
  const remaining = featured ? stories.filter((story) => story.id !== featured.id) : stories;

  return (
    <>
      <PageHero eyebrow="Informasi Kelurahan" title="Kabar" description="Artikel, kegiatan, pengumuman, pelayanan, pembangunan, potensi, serta perkembangan terbaru Kelurahan Benteng Selatan." />
      <section className="section">
        <div className="container">
          {featured ? (
            <article className="featured-kabar">
              <img src={featured.image || "/images/story-placeholder.svg"} alt={featured.title} />
              <div>
                <div className="kabar-badges"><span className="category-label">{featured.category}</span><span className="featured-label">Kabar utama</span></div>
                <h2>{featured.title}</h2>
                <p>{featured.excerpt}</p>
                <div className="kabar-meta">
                  {displayDate(featured.publishedAt) ? <span><CalendarDays size={16} /> {displayDate(featured.publishedAt)}</span> : null}
                  {featured.generalLocation ? <span><MapPin size={16} /> {featured.generalLocation}</span> : null}
                </div>
                <Link href={`/wisata/${featured.slug}`} className="button button-primary">Baca Kabar <ArrowRight size={18} /></Link>
              </div>
            </article>
          ) : <div className="empty-state">Belum ada Kabar yang diterbitkan.</div>}

          {remaining.length ? (
            <div className="kabar-list-section">
              <div className="section-heading compact-heading"><span className="eyebrow">Kabar terbaru</span><h2>Informasi dan kegiatan kelurahan</h2><p>Pilih kategori untuk menemukan informasi yang dibutuhkan.</p></div>
              <StoryBrowser stories={remaining} />
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
