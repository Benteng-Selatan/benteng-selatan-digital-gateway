"use client";

import Link from "next/link";
import { ArrowRight, FileText, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { ServiceItem } from "@/lib/types";

export function ServiceBrowser({ services }: { services: ServiceItem[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return services;
    return services.filter((item) => `${item.name} ${item.shortDescription}`.toLowerCase().includes(needle));
  }, [query, services]);

  return (
    <>
      <label className="search-box">
        <Search size={20} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama layanan..." />
      </label>
      <div className="card-grid card-grid-3">
        {filtered.map((service) => (
          <article className="info-card" key={service.id}>
            <span className="icon-box"><FileText size={22} /></span>
            <h2>{service.name}</h2>
            <p>{service.shortDescription}</p>
            <Link href={`/layanan/${service.slug}`} className="text-link">Lihat persyaratan <ArrowRight size={17} /></Link>
          </article>
        ))}
      </div>
      {!filtered.length ? <div className="empty-state">Tidak ada layanan yang sesuai dengan pencarian.</div> : null}
    </>
  );
}
