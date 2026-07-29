"use client";

import Link from "next/link";
import { ArrowRight, MapPin, Search, Store } from "lucide-react";
import { useMemo, useState } from "react";
import type { UmkmItem } from "@/lib/types";

export function UmkmBrowser({ items }: { items: UmkmItem[] }) {
  const categories = ["Semua", ...Array.from(new Set(items.map((item) => item.category)))];
  const [category, setCategory] = useState("Semua");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory = category === "Semua" || item.category === category;
      const matchesSearch = !needle || `${item.name} ${item.featuredProduct} ${item.description}`.toLowerCase().includes(needle);
      return matchesCategory && matchesSearch;
    });
  }, [category, items, query]);

  return (
    <>
      <div className="directory-toolbar">
        <label className="search-box compact-search">
          <Search size={19} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari UMKM atau produk..." />
        </label>
        <div className="chip-row" aria-label="Filter kategori">
          {categories.map((item) => (
            <button key={item} type="button" className={`chip ${category === item ? "active" : ""}`} onClick={() => setCategory(item)}>
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="card-grid card-grid-3">
        {filtered.map((item) => (
          <article className="media-card" key={item.id}>
            <img src={item.image || "/images/umkm-placeholder.svg"} alt={`Produk ${item.name}`} />
            <div className="media-card-body">
              <span className="category-label"><Store size={15} /> {item.category}</span>
              <h2>{item.name}</h2>
              <strong>{item.featuredProduct}</strong>
              <p>{item.description}</p>
              {item.generalLocation ? <div className="card-meta"><MapPin size={16} /> {item.generalLocation}</div> : null}
              <Link href={`/umkm/${item.slug}`} className="text-link">Lihat profil usaha <ArrowRight size={17} /></Link>
            </div>
          </article>
        ))}
      </div>
      {!filtered.length ? <div className="empty-state">Belum ada UMKM yang sesuai dengan filter.</div> : null}
    </>
  );
}
