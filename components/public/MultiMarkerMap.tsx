"use client";

import { latLngBounds } from "leaflet";
import { useEffect, useMemo } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import type { MapLocation } from "@/lib/types";

type ValidMapLocation = MapLocation & {
  latitude: number;
  longitude: number;
};

function isValidLocation(
  location: MapLocation
): location is ValidMapLocation {
  return (
    typeof location.latitude === "number" &&
    Number.isFinite(location.latitude) &&
    typeof location.longitude === "number" &&
    Number.isFinite(location.longitude)
  );
}

function MapViewportController({
  locations,
}: {
  locations: ValidMapLocation[];
}) {
  const map = useMap();

  const coordinateKey = useMemo(
    () =>
      locations
        .map(
          (location) =>
            `${location.id}:${location.latitude}:${location.longitude}`
        )
        .join("|"),
    [locations]
  );

  useEffect(() => {
    const container = map.getContainer();

    let animationFrame = 0;
    let timeoutId = 0;

    const refreshMap = () => {
      window.cancelAnimationFrame(animationFrame);

      animationFrame = window.requestAnimationFrame(() => {
        /*
         * Leaflet harus diberi tahu ketika ukuran container berubah.
         * Tanpa ini, tile dapat bergeser atau hanya ter-render sebagian.
         */
        map.invalidateSize({
          animate: false,
          pan: false,
        });

        if (locations.length === 0) {
          return;
        }

        if (locations.length === 1) {
          map.setView(
            [
              locations[0].latitude,
              locations[0].longitude,
            ],
            16,
            {
              animate: false,
            }
          );

          return;
        }

        const bounds = latLngBounds(
          locations.map((location) => [
            location.latitude,
            location.longitude,
          ])
        );

        map.fitBounds(bounds, {
          padding: [36, 36],
          maxZoom: 16,
          animate: false,
        });
      });
    };

    /*
     * Tunggu sampai grid/flex layout halaman selesai dihitung.
     */
    timeoutId = window.setTimeout(refreshMap, 150);

    /*
     * Jalankan ulang ketika panel peta berubah ukuran,
     * misalnya karena resize browser atau perubahan layout.
     */
    const resizeObserver = new ResizeObserver(refreshMap);
    resizeObserver.observe(container);

    window.addEventListener("resize", refreshMap);

    return () => {
      window.clearTimeout(timeoutId);
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", refreshMap);
    };
  }, [coordinateKey, locations, map]);

  return null;
}

export function MultiMarkerMap({
  locations,
}: {
  locations: MapLocation[];
}) {
  const validLocations = useMemo(
    () => locations.filter(isValidLocation),
    [locations]
  );

  if (validLocations.length === 0) {
    return (
      <div className="map-empty-state">
        <h2>Daftar lokasi Benteng Selatan</h2>

        <p>
          Informasi lokasi dapat dilihat pada daftar. Gunakan tautan petunjuk arah pada lokasi yang tersedia.
        </p>
      </div>
    );
  }

  const firstLocation = validLocations[0];

  return (
    <MapContainer
      center={[
        firstLocation.latitude,
        firstLocation.longitude,
      ]}
      zoom={14}
      minZoom={3}
      maxZoom={19}
      /*
       * Dinonaktifkan agar roda mouse tetap menggulir halaman,
       * bukan membuat zoom peta secara tidak sengaja.
       */
      scrollWheelZoom={false}
      doubleClickZoom
      touchZoom
      dragging
      zoomControl
      preferCanvas
      className="leaflet-map"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      <MapViewportController locations={validLocations} />

      {validLocations.map((location) => (
        <CircleMarker
          key={location.id}
          center={[
            location.latitude,
            location.longitude,
          ]}
          radius={9}
          pathOptions={{
            color: "#ffffff",
            weight: 3,
            fillColor: "#0f766e",
            fillOpacity: 1,
          }}
        >
          <Popup>
            <div className="map-popup-content">
              <strong>{location.name}</strong>

              <span>{location.category}</span>

              {location.description ? (
                <p>{location.description}</p>
              ) : null}

              {location.generalLocation ? (
                <small>{location.generalLocation}</small>
              ) : null}

              {location.mapsUrl ? (
                <a
                  href={location.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Buka petunjuk arah
                </a>
              ) : null}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}