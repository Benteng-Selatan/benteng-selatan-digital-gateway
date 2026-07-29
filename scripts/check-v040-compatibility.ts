import assert from "node:assert/strict";

import { defaultSiteData, normalizeSiteData } from "../lib/site-data-normalizer";
import type { ServiceItem, SiteData } from "../lib/types";

type LegacySiteData = Omit<SiteData, "site" | "contact" | "services"> & {
  site: Omit<SiteData["site"], "bestiUrl"> & { bestiUrl?: string };
  contact: Omit<SiteData["contact"], "officials"> & { officials?: SiteData["contact"]["officials"] };
  services: Array<Omit<ServiceItem, "featured"> & { featured?: boolean }>;
};

const legacy = structuredClone(defaultSiteData) as unknown as LegacySiteData;

legacy.site.name = "Nama website yang sudah tersimpan";
legacy.site.bestiUrl = undefined;
legacy.contact.phone = "0812-DATA-LAMA";
legacy.contact.officials = undefined;
legacy.socialDashboard.totalRecords = 9999;
legacy.services = legacy.services
  .filter((service) => ["surat-keterangan-usaha", "surat-keterangan-domisili"].includes(service.slug))
  .map((service) => {
    const item = { ...service };
    delete item.featured;
    return item;
  });
legacy.services.push({
  id: "layanan-lama-tetap",
  slug: "layanan-lama-tetap",
  name: "Layanan Lama Tetap",
  shortDescription: "Data lama tidak boleh hilang.",
  requirements: [],
  steps: [],
  serviceHours: "",
  location: "",
  contact: "",
  note: "",
  status: "published",
});
legacy.umkm.push({ ...legacy.umkm[0], id: "umkm-lama-tetap", slug: "umkm-lama-tetap", name: "UMKM Lama Tetap" });
legacy.stories.push({ ...legacy.stories[0], id: "kabar-lama-tetap", slug: "kabar-lama-tetap", title: "Kabar Lama Tetap" });

const normalized = normalizeSiteData(legacy as unknown as SiteData);
const serviceIds = normalized.services.map((service) => service.id);

assert.equal(normalized.site.name, "Nama website yang sudah tersimpan");
assert.equal(normalized.contact.phone, "0812-DATA-LAMA");
assert.equal(normalized.socialDashboard.totalRecords, 9999);
assert.equal(normalized.site.bestiUrl, "https://besti.is-best.net/");
assert.equal(normalized.contact.officials.length, 5);
assert.equal(normalized.services.filter((service) => service.featured && service.status === "published").length, 10);
assert.equal(new Set(serviceIds).size, serviceIds.length);
assert(normalized.services.some((service) => service.id === "layanan-lama-tetap"));
assert(normalized.umkm.some((item) => item.id === "umkm-lama-tetap"));
assert(normalized.stories.some((item) => item.id === "kabar-lama-tetap"));

console.log("v0.4.0 compatibility check: OK");
