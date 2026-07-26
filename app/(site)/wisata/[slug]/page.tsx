import Link from "next/link";
import { ArrowLeft, BookOpen, CalendarDays, MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/public/PageHero";
import { getSiteData } from "@/lib/cms";

export const dynamic = "force-dynamic";

const typeLabels = {
  article: "Artikel",
  announcement: "Pengumuman",
  agenda: "Agenda",
} as const;

function displayDate(value: string) {
  if (!value) return "Tanggal belum diisi";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export default async function StoryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getSiteData();
  const story = data.stories.find((item) => item.slug === slug && item.status === "published");
  if (!story) notFound();

  return (
    <>
      <PageHero eyebrow={`${story.category} · ${typeLabels[story.articleType]}`} title={story.title} description={story.excerpt}>
        <Link href="/wisata" className="back-link"><ArrowLeft size={17} /> Kembali ke Kabar</Link>
      </PageHero>
      <article className="section article-page">
        <div className="container article-container">
          <img className="article-cover" src={story.image || "/images/story-placeholder.svg"} alt={story.title} />
          <div className="article-meta">
            <span><CalendarDays size={17} /> Terbit {displayDate(story.publishedAt)}</span>
            {story.eventDate ? <span><CalendarDays size={17} /> Kegiatan {displayDate(story.eventDate)}</span> : null}
            {story.generalLocation ? <span><MapPin size={17} /> {story.generalLocation}</span> : null}
            <span><BookOpen size={17} /> Sumber: {story.source || "Kelurahan Benteng Selatan"}</span>
          </div>
          <div className="article-content">{story.content.split("\n").filter(Boolean).map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>)}</div>
        </div>
      </article>
    </>
  );
}
