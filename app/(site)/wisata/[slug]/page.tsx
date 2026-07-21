import Link from "next/link";
import { ArrowLeft, BookOpen, MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/public/PageHero";
import { getSiteData } from "@/lib/cms";

export const dynamic = "force-dynamic";

export default async function StoryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getSiteData();
  const story = data.stories.find((item) => item.slug === slug && item.status === "published");
  if (!story) notFound();
  return (
    <>
      <PageHero eyebrow={story.category} title={story.title} description={story.excerpt}><Link href="/wisata" className="back-link"><ArrowLeft size={17} /> Kembali ke daftar cerita</Link></PageHero>
      <article className="section article-page"><div className="container article-container"><img className="article-cover" src={story.image || "/images/story-placeholder.svg"} alt={story.title} /><div className="article-meta"><span><MapPin size={17} /> {story.generalLocation || "Lokasi umum belum diisi"}</span><span><BookOpen size={17} /> Sumber: {story.source || "Belum diisi"}</span></div><div className="article-content">{story.content.split("\n").map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></div></article>
    </>
  );
}
