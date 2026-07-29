"use client";

import dynamic from "next/dynamic";
import { ExternalLink, MapPin } from "lucide-react";
import { useMemo, useState } from "react";

import type { MapLocation } from "@/lib/types";

const MultiMarkerMap = dynamic(
  () =>
    import("@/components/public/MultiMarkerMap").then(
      (module) => module.MultiMarkerMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="map-placeholder">
        <MapPin size={42} />

        <h2>Memuat peta...</h2>
      </div>
    ),
  }
);

export function MapExplorer({
  locations,
}: {
  locations: MapLocation[];
}) {
  const categories = [
    "Semua",
    ...Array.from(
      new Set(locations.map((item) => item.category))
    ),
  ];

  const [category, setCategory] = useState("Semua");

  const filtered = useMemo(() => {
    if (category === "Semua") {
      return locations;
    }

    return locations.filter(
      (item) => item.category === category
    );
  }, [category, locations]);

  return (
    <div className="map-layout">
      <aside className="map-sidebar">
        <div className="chip-row vertical-chips">
          {categories.map((item) => (
            <button
              type="button"
              key={item}
              className={`chip ${
                category === item ? "active" : ""
              }`}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="location-list">
          {filtered.map((location) => (
            <article
              className="location-card"
              key={location.id}
            >
              <span className="icon-box small">
                <MapPin size={18} />
              </span>

              <div>
                <span className="category-label">
                  {location.category}
                </span>

                <h3>{location.name}</h3>

                {location.description ? <p>{location.description}</p> : null}

                {location.generalLocation ? <small>{location.generalLocation}</small> : null}

                {location.mapsUrl ? (
                  <a
                    href={location.mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-link"
                  >
                    Buka petunjuk arah
                    <ExternalLink size={15} />
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </aside>

      <div className="map-panel">
        <MultiMarkerMap locations={filtered} />
      </div>
    </div>
  );
}