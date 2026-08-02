import { validatePopulationDashboard } from "@/lib/population-dashboard";
import { validateSocialDashboard } from "@/lib/social-dashboard";
import {
  STORY_CATEGORIES,
  STORY_TYPES,
  type PublishStatus,
  type SiteData,
} from "@/lib/types";

const STATUS_VALUES: PublishStatus[] = ["draft", "published"];
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/;
const PHONE_PATTERN = /^[+0-9()\s.-]{0,30}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function envHosts(name: string): string[] {
  return (process.env[name] || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function hostnameMatches(hostname: string, allowed: readonly string[]): boolean {
  const normalized = hostname.toLowerCase();
  return allowed.some((entry) => entry === "*" || normalized === entry || (entry.startsWith("*.") && normalized.endsWith(entry.slice(1))));
}

const BESTI_HOSTS = ["besti.is-best.net", ...envHosts("CMS_ALLOWED_BESTI_HOSTS")];
const SOCIAL_HOSTS = ["instagram.com", "www.instagram.com", "facebook.com", "www.facebook.com", "fb.com", ...envHosts("CMS_ALLOWED_SOCIAL_HOSTS")];
const MAP_HOSTS = ["google.com", "www.google.com", "maps.google.com", "maps.app.goo.gl", "goo.gl", ...envHosts("CMS_ALLOWED_MAP_HOSTS")];
const MARKETPLACE_HOSTS = ["shopee.co.id", "www.shopee.co.id", "tokopedia.com", "www.tokopedia.com", "bukalapak.com", "www.bukalapak.com", ...envHosts("CMS_ALLOWED_MARKETPLACE_HOSTS")];
const EXTERNAL_HOSTS = [...envHosts("CMS_ALLOWED_EXTERNAL_HOSTS")];
const IMAGE_HOSTS = ["*.public.blob.vercel-storage.com", ...envHosts("CMS_ALLOWED_IMAGE_HOSTS")];

function add(errors: string[], condition: boolean, message: string): void {
  if (!condition) errors.push(message);
}

function stringField(errors: string[], value: unknown, path: string, options: { min?: number; max: number; optional?: boolean } ): value is string {
  if (typeof value !== "string") {
    errors.push(`${path} harus berupa teks.`);
    return false;
  }
  const length = value.trim().length;
  if (!options.optional && length < (options.min ?? 1)) errors.push(`${path} wajib diisi.`);
  if (length > options.max) errors.push(`${path} maksimal ${options.max} karakter.`);
  return true;
}

function integerField(errors: string[], value: unknown, path: string, min = 0): value is number {
  const valid = typeof value === "number" && Number.isInteger(value) && value >= min;
  if (!valid) errors.push(`${path} harus berupa bilangan bulat minimal ${min}.`);
  return valid;
}

function statusField(errors: string[], value: unknown, path: string): value is PublishStatus {
  const valid = typeof value === "string" && STATUS_VALUES.includes(value as PublishStatus);
  if (!valid) errors.push(`${path} harus bernilai draft atau published.`);
  return valid;
}

function arrayField(errors: string[], value: unknown, path: string, max: number): value is unknown[] {
  if (!Array.isArray(value)) {
    errors.push(`${path} harus berupa daftar.`);
    return false;
  }
  if (value.length > max) errors.push(`${path} maksimal berisi ${max} item.`);
  return true;
}

function textArray(errors: string[], value: unknown, path: string, maxItems: number, maxLength: number): value is string[] {
  if (!arrayField(errors, value, path, maxItems)) return false;
  value.forEach((item, index) => stringField(errors, item, `${path}[${index}]`, { max: maxLength }));
  return true;
}

function validateUrl(errors: string[], value: unknown, path: string, options: { optional?: boolean; internal?: boolean; hosts?: readonly string[]; image?: boolean }): void {
  if (!stringField(errors, value, path, { max: 1000, optional: options.optional })) return;
  const input = value.trim();
  if (!input && options.optional) return;
  if (options.internal && input.startsWith("/") && !input.startsWith("//") && !/[\r\n]/.test(input)) return;
  if (options.image && input.startsWith("/images/") && !input.includes("..")) return;
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    errors.push(`${path} harus berupa URL yang valid.`);
    return;
  }
  if (parsed.protocol !== "https:") {
    errors.push(`${path} hanya boleh menggunakan HTTPS.`);
    return;
  }
  if (parsed.username || parsed.password) errors.push(`${path} tidak boleh memuat username atau password pada URL.`);
  const allowed = options.hosts || [];
  if (options.hosts !== undefined && !hostnameMatches(parsed.hostname, allowed)) {
    const detail = allowed.length > 0
      ? `host yang belum diizinkan: ${parsed.hostname}`
      : `host eksternal belum dikonfigurasi`;
    errors.push(`${path} menggunakan ${detail}.`);
  }
}

function validateId(errors: string[], value: unknown, path: string): void {
  if (stringField(errors, value, path, { max: 120 }) && !ID_PATTERN.test(value)) errors.push(`${path} mengandung karakter yang tidak diizinkan.`);
}

function validateSlug(errors: string[], value: unknown, path: string): void {
  if (stringField(errors, value, path, { max: 120 }) && !SLUG_PATTERN.test(value)) errors.push(`${path} harus menggunakan huruf kecil, angka, dan tanda hubung.`);
}

function validateDate(errors: string[], value: unknown, path: string, optional = false): void {
  if (!stringField(errors, value, path, { max: 20, optional })) return;
  if (!value.trim() && optional) return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) errors.push(`${path} harus menggunakan format YYYY-MM-DD.`);
}

function validateUnique(errors: string[], values: string[], path: string): void {
  const normalized = values.map((value) => value.trim().toLowerCase());
  if (new Set(normalized).size !== normalized.length) errors.push(`${path} harus unik.`);
}

export function siteDataValidationErrors(value: unknown): string[] {
  const errors: string[] = [];
  if (!isRecord(value)) return ["Payload CMS harus berupa objek."];

  const site = value.site;
  if (!isRecord(site)) errors.push("site wajib berupa objek.");
  else {
    stringField(errors, site.name, "site.name", { max: 120 });
    stringField(errors, site.kelurahan, "site.kelurahan", { max: 120 });
    stringField(errors, site.tagline, "site.tagline", { max: 220 });
    stringField(errors, site.description, "site.description", { max: 1200 });
    validateUrl(errors, site.heroImage, "site.heroImage", { image: true, hosts: IMAGE_HOSTS });
    stringField(errors, site.primaryCtaLabel, "site.primaryCtaLabel", { max: 80 });
    validateUrl(errors, site.primaryCtaHref, "site.primaryCtaHref", { internal: true, hosts: EXTERNAL_HOSTS });
    stringField(errors, site.secondaryCtaLabel, "site.secondaryCtaLabel", { max: 80 });
    validateUrl(errors, site.secondaryCtaHref, "site.secondaryCtaHref", { internal: true, hosts: EXTERNAL_HOSTS });
    validateUrl(errors, site.bestiUrl, "site.bestiUrl", { hosts: BESTI_HOSTS });
  }

  const profile = value.profile;
  if (!isRecord(profile)) errors.push("profile wajib berupa objek.");
  else {
    stringField(errors, profile.heading, "profile.heading", { max: 180 });
    stringField(errors, profile.description, "profile.description", { max: 2500 });
    stringField(errors, profile.communityOverview, "profile.communityOverview", { max: 2500 });
    textArray(errors, profile.potentials, "profile.potentials", 30, 300);
    textArray(errors, profile.facilities, "profile.facilities", 30, 300);
    stringField(errors, profile.leaderName, "profile.leaderName", { max: 160 });
    stringField(errors, profile.governmentDescription, "profile.governmentDescription", { max: 2500 });
    validateUrl(errors, profile.image, "profile.image", { image: true, hosts: IMAGE_HOSTS });
  }

  const contact = value.contact;
  if (!isRecord(contact)) errors.push("contact wajib berupa objek.");
  else {
    stringField(errors, contact.address, "contact.address", { max: 1000, optional: true });
    stringField(errors, contact.serviceHours, "contact.serviceHours", { max: 250, optional: true });
    for (const key of ["phone", "whatsapp"] as const) {
      if (stringField(errors, contact[key], `contact.${key}`, { max: 30, optional: true }) && contact[key] && !PHONE_PATTERN.test(contact[key])) errors.push(`contact.${key} memiliki format yang tidak valid.`);
    }
    if (stringField(errors, contact.email, "contact.email", { max: 180, optional: true }) && contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) errors.push("contact.email tidak valid.");
    validateUrl(errors, contact.instagram, "contact.instagram", { optional: true, hosts: SOCIAL_HOSTS });
    validateUrl(errors, contact.facebook, "contact.facebook", { optional: true, hosts: SOCIAL_HOSTS });
    validateUrl(errors, contact.mapsUrl, "contact.mapsUrl", { optional: true, hosts: MAP_HOSTS });
    if (arrayField(errors, contact.officials, "contact.officials", 50)) {
      const ids: string[] = [];
      contact.officials.forEach((item, index) => {
        if (!isRecord(item)) return errors.push(`contact.officials[${index}] harus berupa objek.`);
        validateId(errors, item.id, `contact.officials[${index}].id`);
        if (typeof item.id === "string") ids.push(item.id);
        stringField(errors, item.name, `contact.officials[${index}].name`, { max: 160 });
        stringField(errors, item.role, `contact.officials[${index}].role`, { max: 160 });
        if (stringField(errors, item.phone, `contact.officials[${index}].phone`, { max: 30, optional: true }) && item.phone && !PHONE_PATTERN.test(item.phone)) errors.push(`contact.officials[${index}].phone tidak valid.`);
      });
      validateUnique(errors, ids, "ID kontak perangkat");
    }
  }

  const services = value.services;
  if (arrayField(errors, services, "services", 100)) {
    const ids: string[] = [], slugs: string[] = [];
    services.forEach((item, index) => {
      if (!isRecord(item)) return errors.push(`services[${index}] harus berupa objek.`);
      validateId(errors, item.id, `services[${index}].id`); if (typeof item.id === "string") ids.push(item.id);
      validateSlug(errors, item.slug, `services[${index}].slug`); if (typeof item.slug === "string") slugs.push(item.slug);
      stringField(errors, item.name, `services[${index}].name`, { max: 180 });
      stringField(errors, item.shortDescription, `services[${index}].shortDescription`, { max: 800 });
      textArray(errors, item.requirements, `services[${index}].requirements`, 50, 500);
      textArray(errors, item.steps, `services[${index}].steps`, 50, 500);
      for (const key of ["serviceHours", "location", "contact", "note"] as const) stringField(errors, item[key], `services[${index}].${key}`, { max: key === "note" ? 1500 : 500, optional: true });
      add(errors, typeof item.featured === "boolean", `services[${index}].featured harus boolean.`);
      statusField(errors, item.status, `services[${index}].status`);
    });
    validateUnique(errors, ids, "ID layanan"); validateUnique(errors, slugs, "Slug layanan");
  }

  const socialStatistics = value.socialStatistics;
  if (arrayField(errors, socialStatistics, "socialStatistics", 100)) {
    socialStatistics.forEach((item, index) => {
      if (!isRecord(item)) return errors.push(`socialStatistics[${index}] harus berupa objek.`);
      validateId(errors, item.id, `socialStatistics[${index}].id`);
      stringField(errors, item.category, `socialStatistics[${index}].category`, { max: 180 });
      integerField(errors, item.value, `socialStatistics[${index}].value`);
      stringField(errors, item.description, `socialStatistics[${index}].description`, { max: 1000 });
      stringField(errors, item.year, `socialStatistics[${index}].year`, { max: 20 });
      stringField(errors, item.source, `socialStatistics[${index}].source`, { max: 500 });
      statusField(errors, item.status, `socialStatistics[${index}].status`);
    });
  }

  const socialDashboard = value.socialDashboard;
  if (!isRecord(socialDashboard)) errors.push("socialDashboard wajib berupa objek.");
  else {
    let validStructure = true;
    validStructure = statusField(errors, socialDashboard.status, "socialDashboard.status") && validStructure;
    validStructure = stringField(errors, socialDashboard.period, "socialDashboard.period", { max: 120, optional: true }) && validStructure;
    validStructure = stringField(errors, socialDashboard.source, "socialDashboard.source", { max: 500, optional: true }) && validStructure;
    validStructure = stringField(errors, socialDashboard.note, "socialDashboard.note", { max: 1500, optional: true }) && validStructure;
    validStructure = integerField(errors, socialDashboard.totalRecords, "socialDashboard.totalRecords", 1) && validStructure;

    const pbiJk = socialDashboard.pbiJk;
    if (!isRecord(pbiJk)) { errors.push("socialDashboard.pbiJk wajib berupa objek."); validStructure = false; }
    else {
      validStructure = integerField(errors, pbiJk.yes, "socialDashboard.pbiJk.yes") && validStructure;
      validStructure = integerField(errors, pbiJk.no, "socialDashboard.pbiJk.no") && validStructure;
      validStructure = stringField(errors, pbiJk.period, "socialDashboard.pbiJk.period", { max: 120, optional: true }) && validStructure;
    }

    for (const section of ["pkh", "sembako"] as const) {
      const item = socialDashboard[section];
      if (!isRecord(item)) { errors.push(`socialDashboard.${section} wajib berupa objek.`); validStructure = false; continue; }
      for (const key of ["no", "family", "administrator"] as const) {
        validStructure = integerField(errors, item[key], `socialDashboard.${section}.${key}`) && validStructure;
      }
      validStructure = stringField(errors, item.period, `socialDashboard.${section}.period`, { max: 120, optional: true }) && validStructure;
    }

    const deciles = socialDashboard.deciles;
    if (!isRecord(deciles)) { errors.push("socialDashboard.deciles wajib berupa objek."); validStructure = false; }
    else {
      for (const key of ["d1", "d2", "d3", "d4", "d5"] as const) {
        validStructure = integerField(errors, deciles[key], `socialDashboard.deciles.${key}`) && validStructure;
      }
    }

    if (validStructure) errors.push(...validateSocialDashboard(socialDashboard as unknown as SiteData["socialDashboard"]));
  }

  const populationDashboard = value.populationDashboard;
  if (!isRecord(populationDashboard)) errors.push("populationDashboard wajib berupa objek.");
  else {
    let validStructure = true;
    validStructure = statusField(errors, populationDashboard.status, "populationDashboard.status") && validStructure;
    validStructure = stringField(errors, populationDashboard.period, "populationDashboard.period", { max: 120, optional: true }) && validStructure;
    validStructure = stringField(errors, populationDashboard.source, "populationDashboard.source", { max: 500, optional: true }) && validStructure;
    validStructure = stringField(errors, populationDashboard.note, "populationDashboard.note", { max: 1500, optional: true }) && validStructure;
    if (typeof populationDashboard.isSimulation !== "boolean") { errors.push("populationDashboard.isSimulation harus boolean."); validStructure = false; }
    for (const key of ["totalPopulation", "male", "female", "households", "totalRt", "totalRw"] as const) {
      validStructure = integerField(errors, populationDashboard[key], `populationDashboard.${key}`) && validStructure;
    }

    if (!arrayField(errors, populationDashboard.ageGroups, "populationDashboard.ageGroups", 12)) validStructure = false;
    else {
      populationDashboard.ageGroups.forEach((item, index) => {
        if (!isRecord(item)) { errors.push(`populationDashboard.ageGroups[${index}] harus berupa objek.`); validStructure = false; return; }
        const before = errors.length;
        validateId(errors, item.id, `populationDashboard.ageGroups[${index}].id`);
        stringField(errors, item.label, `populationDashboard.ageGroups[${index}].label`, { max: 120 });
        integerField(errors, item.value, `populationDashboard.ageGroups[${index}].value`);
        if (errors.length > before) validStructure = false;
      });
    }

    if (!arrayField(errors, populationDashboard.neighborhoods, "populationDashboard.neighborhoods", 500)) validStructure = false;
    else {
      populationDashboard.neighborhoods.forEach((item, index) => {
        if (!isRecord(item)) { errors.push(`populationDashboard.neighborhoods[${index}] harus berupa objek.`); validStructure = false; return; }
        const before = errors.length;
        validateId(errors, item.id, `populationDashboard.neighborhoods[${index}].id`);
        stringField(errors, item.rw, `populationDashboard.neighborhoods[${index}].rw`, { max: 20 });
        for (const key of ["rt", "male", "female", "total", "households"] as const) {
          integerField(errors, item[key], `populationDashboard.neighborhoods[${index}].${key}`);
        }
        stringField(errors, item.populationCategory, `populationDashboard.neighborhoods[${index}].populationCategory`, { max: 100 });
        if (errors.length > before) validStructure = false;
      });
    }

    if (validStructure) errors.push(...validatePopulationDashboard(populationDashboard as unknown as SiteData["populationDashboard"]));
  }

  const socialContent = value.socialContent;
  if (!isRecord(socialContent)) errors.push("socialContent wajib berupa objek.");
  else {
    stringField(errors, socialContent.intro, "socialContent.intro", { max: 2000 });
    textArray(errors, socialContent.accessBarriers, "socialContent.accessBarriers", 30, 500);
    textArray(errors, socialContent.recommendations, "socialContent.recommendations", 30, 500);
    textArray(errors, socialContent.serviceFlow, "socialContent.serviceFlow", 30, 500);
    stringField(errors, socialContent.referralContact, "socialContent.referralContact", { max: 1000 });
    stringField(errors, socialContent.privacyNote, "socialContent.privacyNote", { max: 1500 });
  }

  const umkm = value.umkm;
  if (arrayField(errors, umkm, "umkm", 500)) {
    const ids: string[] = [], slugs: string[] = [];
    umkm.forEach((item, index) => {
      if (!isRecord(item)) return errors.push(`umkm[${index}] harus berupa objek.`);
      validateId(errors, item.id, `umkm[${index}].id`); if (typeof item.id === "string") ids.push(item.id);
      validateSlug(errors, item.slug, `umkm[${index}].slug`); if (typeof item.slug === "string") slugs.push(item.slug);
      for (const [key, max] of [["name",180],["category",100],["featuredProduct",180],["description",2500],["publicContact",80],["generalLocation",500]] as const) stringField(errors, item[key], `umkm[${index}].${key}`, { max, optional: key === "publicContact" });
      validateUrl(errors, item.image, `umkm[${index}].image`, { image: true, hosts: IMAGE_HOSTS });
      validateUrl(errors, item.instagram, `umkm[${index}].instagram`, { optional: true, hosts: SOCIAL_HOSTS });
      validateUrl(errors, item.marketplace, `umkm[${index}].marketplace`, { optional: true, hosts: MARKETPLACE_HOSTS.length ? MARKETPLACE_HOSTS : EXTERNAL_HOSTS });
      add(errors, typeof item.contactApproved === "boolean", `umkm[${index}].contactApproved harus boolean.`);
      statusField(errors, item.status, `umkm[${index}].status`);
    });
    validateUnique(errors, ids, "ID UMKM"); validateUnique(errors, slugs, "Slug UMKM");
  }

  const maps = value.mapLocations;
  if (arrayField(errors, maps, "mapLocations", 500)) {
    const ids: string[] = [];
    maps.forEach((item, index) => {
      if (!isRecord(item)) return errors.push(`mapLocations[${index}] harus berupa objek.`);
      validateId(errors, item.id, `mapLocations[${index}].id`); if (typeof item.id === "string") ids.push(item.id);
      for (const [key, max] of [["name",180],["category",100],["description",2000],["generalLocation",500]] as const) stringField(errors, item[key], `mapLocations[${index}].${key}`, { max });
      const latValid = item.latitude === null || (typeof item.latitude === "number" && Number.isFinite(item.latitude) && item.latitude >= -90 && item.latitude <= 90);
      const lngValid = item.longitude === null || (typeof item.longitude === "number" && Number.isFinite(item.longitude) && item.longitude >= -180 && item.longitude <= 180);
      add(errors, latValid, `mapLocations[${index}].latitude tidak valid.`); add(errors, lngValid, `mapLocations[${index}].longitude tidak valid.`);
      validateUrl(errors, item.mapsUrl, `mapLocations[${index}].mapsUrl`, { optional: true, hosts: MAP_HOSTS });
      statusField(errors, item.status, `mapLocations[${index}].status`);
    });
    validateUnique(errors, ids, "ID lokasi peta");
  }

  const stories = value.stories;
  if (arrayField(errors, stories, "stories", 500)) {
    const ids: string[] = [], slugs: string[] = [];
    stories.forEach((item, index) => {
      if (!isRecord(item)) return errors.push(`stories[${index}] harus berupa objek.`);
      validateId(errors, item.id, `stories[${index}].id`); if (typeof item.id === "string") ids.push(item.id);
      validateSlug(errors, item.slug, `stories[${index}].slug`); if (typeof item.slug === "string") slugs.push(item.slug);
      for (const [key, max] of [["title",220],["category",100],["excerpt",700],["content",12000],["generalLocation",500],["source",500]] as const) stringField(errors, item[key], `stories[${index}].${key}`, { max, optional: key === "generalLocation" });
      if (typeof item.category === "string" && !STORY_CATEGORIES.includes(item.category as (typeof STORY_CATEGORIES)[number])) errors.push(`stories[${index}].category tidak terdaftar.`);
      if (typeof item.articleType !== "string" || !STORY_TYPES.includes(item.articleType as (typeof STORY_TYPES)[number])) errors.push(`stories[${index}].articleType tidak valid.`);
      validateUrl(errors, item.image, `stories[${index}].image`, { image: true, hosts: IMAGE_HOSTS });
      validateDate(errors, item.publishedAt, `stories[${index}].publishedAt`);
      validateDate(errors, item.eventDate, `stories[${index}].eventDate`, true);
      add(errors, typeof item.featured === "boolean", `stories[${index}].featured harus boolean.`);
      statusField(errors, item.status, `stories[${index}].status`);
    });
    validateUnique(errors, ids, "ID Kabar"); validateUnique(errors, slugs, "Slug Kabar");
  }

  if (typeof value.updatedAt !== "string" || Number.isNaN(Date.parse(value.updatedAt))) errors.push("updatedAt harus berupa tanggal ISO yang valid.");
  return [...new Set(errors)].slice(0, 100);
}

export function validateSiteDataInput(value: unknown): value is SiteData {
  return siteDataValidationErrors(value).length === 0;
}
