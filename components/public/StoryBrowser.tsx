"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { useMemo, useState } from "react";
import type { StoryItem } from "@/lib/types";

const typeLabels: Record<StoryItem["articleType"], string> = {
  article: "Artikel",
  announcement: "Pengumuman",
  agenda: "Agenda",
};

function displayDate(value: string) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export function StoryBrowser({ stories }: { stories: StoryItem[] }) {
  const [category, setCategory] = useState("Semua");
  const categories = useMemo(
    () => ["Semua", ...Array.from(new Set(stories.map((story) => story.category))).sort((a, b) => a.localeCompare(b, "id"))],
    [stories]
  );
  const filtered = category === "Semua" ? stories : stories.filter((story) => story.category === category);

  return (
    <>
      <div className="directory-toolbar story-toolbar">
        <div className="chip-row" aria-label="Filter kategori Kabar">
          {categories.map((item) => (
            <button key={item} type="button" className={`chip ${category === item ? "active" : ""}`} onClick={() => setCategory(item)}>
              {item}
            </button>
          ))}
        </div>
      </div>

      {filtered.length ? (
        <div className="kabar-grid">
          {filtered.map((story) => (
            <article className={`kabar-card ${story.articleType}`} key={story.id}>
              <img src={story.image || "/images/story-placeholder.svg"} alt={story.title} />
              <div className="kabar-card-body">
                <div className="kabar-badges"><span className="category-label">{story.category}</span><span className="content-type-badge">{typeLabels[story.articleType]}</span></div>
                <h2>{story.title}</h2>
                <p>{story.excerpt}</p>
                <div className="kabar-meta">
                  {displayDate(story.publishedAt) ? <span><CalendarDays size={15} /> {displayDate(story.publishedAt)}</span> : null}
                  {story.generalLocation ? <span><MapPin size={15} /> {story.generalLocation}</span> : null}
                </div>
                <Link href={`/wisata/${story.slug}`} className="text-link">Baca selengkapnya <ArrowRight size={17} /></Link>
              </div>
            </article>
          ))}
        </div>
      ) : <div className="empty-state">Belum ada Kabar pada kategori ini.</div>}
    </>
  );
}
