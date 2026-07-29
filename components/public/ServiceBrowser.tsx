"use client";

import { ExternalLink, FileText, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { ServiceItem } from "@/lib/types";

export function ServiceBrowser({ services, bestiUrl }: { services: ServiceItem[]; bestiUrl: string }) {
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
      <div className="card-grid card-grid-2 service-list-grid">
        {filtered.map((service, index) => (
          <article className="info-card service-summary-card" key={service.id}>
            <div className="service-card-topline">
              <span className="icon-box"><FileText size={22} /></span>
              <span className="service-number">{String(index + 1).padStart(2, "0")}</span>
            </div>
            <h2>{service.name}</h2>
            <p>{service.shortDescription}</p>
            <a href={bestiUrl} className="button button-outline service-besti-button" target="_blank" rel="noreferrer">
              Prosedur dan pengajuan di BESTI <ExternalLink size={17} />
            </a>
          </article>
        ))}
      </div>
      {!filtered.length ? <div className="empty-state">Tidak ada layanan yang sesuai dengan pencarian.</div> : null}
    </>
  );
}
