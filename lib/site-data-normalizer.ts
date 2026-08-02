import seedData from "../data/site-data.seed.json";
import { STORY_TYPES } from "./types";
import type {
  MapLocation,
  ContactData,
  PopulationDashboard,
  ProfileData,
  ServiceItem,
  SiteData,
  SiteSettings,
  SocialContent,
  SocialDashboard,
  SocialStatistic,
  StoryItem,
} from "./types";

export const defaultSiteData = seedData as SiteData;

const LEGACY_COPY = {
  siteDescription: "Portal informasi awal Kelurahan Benteng Selatan untuk membantu masyarakat menemukan informasi layanan publik, UMKM, kesejahteraan sosial, fasilitas wilayah, serta kearifan lokal.",
  profileDescription: "Halaman ini disiapkan sebagai profil singkat wilayah. Narasi final dapat diperbarui melalui CMS setelah diverifikasi bersama perangkat kelurahan.",
  communityOverview: "Benteng Selatan memiliki masyarakat dengan aktivitas sosial dan ekonomi yang beragam. Konten ini masih berupa teks awal dan harus disesuaikan berdasarkan data lapangan terverifikasi.",
  leaderName: "[Nama lurah belum diisi]",
  governmentDescription: "Informasi pemerintahan kelurahan dapat ditambahkan setelah memperoleh data resmi.",
  contactAddress: "[Alamat kantor kelurahan belum diisi]",
  serviceHours: "[Jam pelayanan belum diisi]",
  serviceContact: "Hubungi kontak resmi kelurahan untuk informasi awal",
  socialIntro: "Informasi kesejahteraan sosial ditampilkan dalam bentuk agregat agar masyarakat dapat memperoleh gambaran umum tanpa membuka data pribadi warga.",
  referralContact: "[Kontak rujukan layanan sosial belum diisi]",
  privacyNote: "Data yang ditampilkan merupakan data agregat untuk kebutuhan informasi publik. Data individu tidak ditampilkan guna menjaga kerahasiaan dan perlindungan data pribadi warga.",
} as const;

function sameCopy(value: string | undefined, legacy: string): boolean {
  return (value || "").trim().replace(/\s+/g, " ").toLowerCase() === legacy.trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizeHomeDescription(value: string | undefined): string {
  const normalized = (value || "").trim().replace(/\s+/g, " ");
  const legacy = LEGACY_COPY.siteDescription.replace(/\s+/g, " ");
  if (normalized.toLowerCase() === legacy.toLowerCase() || normalized.toLowerCase() === `${legacy} mantap`.toLowerCase() || normalized.toLowerCase() === `${legacy} mantap.`.toLowerCase()) {
    return defaultSiteData.site.description;
  }
  return value?.trim() || defaultSiteData.site.description;
}

function normalizeCategory(category: string): string {
  const value = category.trim();
  if (/wisata|budaya|kearifan|sejarah/i.test(value)) return "Wisata & Budaya";
  return value || "Kegiatan Kelurahan";
}

function normalizeExternalUrl(value: string | undefined, fallback: string): string {
  try {
    const url = new URL(value || fallback);
    return url.protocol === "https:" ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}

function sameList(value: string[] | undefined, legacy: string[]): boolean {
  if (!Array.isArray(value) || value.length !== legacy.length) return false;
  return value.every((item, index) => sameCopy(item, legacy[index]));
}

export function normalizeSiteData(input: SiteData): SiteData {
  const candidate = input as SiteData & {
    site?: Partial<SiteSettings>;
    profile?: Partial<ProfileData>;
    contact?: Partial<ContactData>;
    services?: Array<Partial<ServiceItem> & Pick<ServiceItem, "id" | "slug" | "name" | "shortDescription" | "requirements" | "steps" | "serviceHours" | "location" | "contact" | "note" | "status">>;
    socialContent?: Partial<SocialContent>;
    socialStatistics?: Array<Partial<SocialStatistic> & Pick<SocialStatistic, "id" | "category" | "value" | "description" | "status">>;
    socialDashboard?: Partial<SocialDashboard>;
    populationDashboard?: Partial<PopulationDashboard>;
    stories?: Array<Partial<StoryItem> & Pick<StoryItem, "id" | "slug" | "title" | "category" | "excerpt" | "content" | "image" | "generalLocation" | "source" | "status">>;
  };

  const site: SiteSettings = {
    ...defaultSiteData.site,
    ...candidate.site,
    description: normalizeHomeDescription(candidate.site?.description),
    bestiUrl: normalizeExternalUrl(candidate.site?.bestiUrl, defaultSiteData.site.bestiUrl),
  };

  const profile: ProfileData = {
    ...defaultSiteData.profile,
    ...candidate.profile,
    description: sameCopy(candidate.profile?.description, LEGACY_COPY.profileDescription)
      ? defaultSiteData.profile.description
      : candidate.profile?.description?.trim() || defaultSiteData.profile.description,
    communityOverview: sameCopy(candidate.profile?.communityOverview, LEGACY_COPY.communityOverview)
      ? defaultSiteData.profile.communityOverview
      : candidate.profile?.communityOverview?.trim() || defaultSiteData.profile.communityOverview,
    leaderName: sameCopy(candidate.profile?.leaderName, LEGACY_COPY.leaderName)
      ? defaultSiteData.profile.leaderName
      : candidate.profile?.leaderName?.trim() || defaultSiteData.profile.leaderName,
    governmentDescription: sameCopy(candidate.profile?.governmentDescription, LEGACY_COPY.governmentDescription)
      ? defaultSiteData.profile.governmentDescription
      : candidate.profile?.governmentDescription?.trim() || defaultSiteData.profile.governmentDescription,
  };

  const contact: ContactData = {
    ...defaultSiteData.contact,
    ...candidate.contact,
    address: sameCopy(candidate.contact?.address, LEGACY_COPY.contactAddress) ? "" : candidate.contact?.address?.trim() || defaultSiteData.contact.address,
    serviceHours: sameCopy(candidate.contact?.serviceHours, LEGACY_COPY.serviceHours) ? "" : candidate.contact?.serviceHours?.trim() || defaultSiteData.contact.serviceHours,
    officials: Array.isArray(candidate.contact?.officials)
      ? candidate.contact.officials
      : defaultSiteData.contact.officials,
  };

  const defaultServicesBySlug = new Map(defaultSiteData.services.map((service) => [service.slug, service]));
  const sourceServices = Array.isArray(candidate.services) ? candidate.services : defaultSiteData.services;
  const existingServiceSlugs = new Set(sourceServices.map((service) => service.slug));
  const services: ServiceItem[] = [
    ...sourceServices.map((service) => {
      const fallback = defaultServicesBySlug.get(service.slug);
      return {
        ...fallback,
        ...service,
        contact: sameCopy(service.contact, LEGACY_COPY.serviceContact)
          ? fallback?.contact || defaultSiteData.services[0].contact
          : service.contact,
        featured: typeof service.featured === "boolean" ? service.featured : Boolean(fallback?.featured),
      } as ServiceItem;
    }),
    ...defaultSiteData.services.filter((service) => service.featured && !existingServiceSlugs.has(service.slug)),
  ];

  const defaultStatisticsById = new Map(
    defaultSiteData.socialStatistics.map((item) => [item.id, item])
  );
  const fallbackSocialYear =
    candidate.socialDashboard?.period?.match(/\b(20\d{2})\b/)?.[1] ||
    defaultSiteData.socialStatistics[0]?.year ||
    String(new Date().getFullYear());
  const fallbackSocialSource =
    candidate.socialDashboard?.source?.trim() ||
    defaultSiteData.socialStatistics[0]?.source ||
    "Data CMS lama - perlu verifikasi";
  const socialStatistics: SocialStatistic[] = (
    Array.isArray(candidate.socialStatistics)
      ? candidate.socialStatistics
      : defaultSiteData.socialStatistics
  ).map((item) => {
    const fallback = defaultStatisticsById.get(item.id);
    return {
      ...fallback,
      ...item,
      year: item.year?.trim() || fallback?.year || fallbackSocialYear,
      source: item.source?.trim() || fallback?.source || fallbackSocialSource,
    } as SocialStatistic;
  });

  const legacyBarriers = [
    "Ringkasan hambatan akses layanan belum diisi",
    "Tambahkan hanya narasi anonim yang telah diverifikasi",
  ];
  const legacyRecommendations = [
    "Perbarui kanal informasi layanan sosial secara berkala",
    "Gunakan bahasa yang sederhana dan mudah dipahami masyarakat",
  ];
  const legacyFlow = [
    "Cari informasi program atau layanan yang dibutuhkan",
    "Hubungi kanal rujukan resmi",
    "Lengkapi proses verifikasi sesuai ketentuan pihak berwenang",
  ];
  const socialContent: SocialContent = {
    ...defaultSiteData.socialContent,
    ...candidate.socialContent,
    intro: sameCopy(candidate.socialContent?.intro, LEGACY_COPY.socialIntro)
      ? defaultSiteData.socialContent.intro
      : candidate.socialContent?.intro?.trim() || defaultSiteData.socialContent.intro,
    accessBarriers: sameList(candidate.socialContent?.accessBarriers, legacyBarriers)
      ? defaultSiteData.socialContent.accessBarriers
      : candidate.socialContent?.accessBarriers || defaultSiteData.socialContent.accessBarriers,
    recommendations: sameList(candidate.socialContent?.recommendations, legacyRecommendations)
      ? defaultSiteData.socialContent.recommendations
      : candidate.socialContent?.recommendations || defaultSiteData.socialContent.recommendations,
    serviceFlow: sameList(candidate.socialContent?.serviceFlow, legacyFlow)
      ? defaultSiteData.socialContent.serviceFlow
      : candidate.socialContent?.serviceFlow || defaultSiteData.socialContent.serviceFlow,
    referralContact: sameCopy(candidate.socialContent?.referralContact, LEGACY_COPY.referralContact)
      ? defaultSiteData.socialContent.referralContact
      : candidate.socialContent?.referralContact?.trim() || defaultSiteData.socialContent.referralContact,
    privacyNote: sameCopy(candidate.socialContent?.privacyNote, LEGACY_COPY.privacyNote)
      ? defaultSiteData.socialContent.privacyNote
      : candidate.socialContent?.privacyNote?.trim() || defaultSiteData.socialContent.privacyNote,
  };

  const rawDashboard = candidate.socialDashboard;
  const dashboard: SocialDashboard = {
    ...defaultSiteData.socialDashboard,
    ...rawDashboard,
    pbiJk: { ...defaultSiteData.socialDashboard.pbiJk, ...rawDashboard?.pbiJk },
    pkh: { ...defaultSiteData.socialDashboard.pkh, ...rawDashboard?.pkh },
    sembako: { ...defaultSiteData.socialDashboard.sembako, ...rawDashboard?.sembako },
    deciles: { ...defaultSiteData.socialDashboard.deciles, ...rawDashboard?.deciles },
  };

  const rawPopulation = candidate.populationDashboard;
  const populationDashboard: PopulationDashboard = {
    ...defaultSiteData.populationDashboard,
    ...rawPopulation,
    ageGroups: Array.isArray(rawPopulation?.ageGroups)
      ? rawPopulation.ageGroups.map((item, index) => ({
          id: item?.id?.trim() || `usia-${index + 1}`,
          label: item?.label?.trim() || `Kelompok usia ${index + 1}`,
          value: Number.isFinite(item?.value) ? Math.max(0, Math.trunc(item.value)) : 0,
        }))
      : defaultSiteData.populationDashboard.ageGroups,
    neighborhoods: Array.isArray(rawPopulation?.neighborhoods)
      ? rawPopulation.neighborhoods.map((item, index) => ({
          id: item?.id?.trim() || `rw-${String(index + 1).padStart(2, "0")}`,
          rw: item?.rw?.trim() || `RW ${String(index + 1).padStart(2, "0")}`,
          rt: Number.isFinite(item?.rt) ? Math.max(0, Math.trunc(item.rt)) : 0,
          male: Number.isFinite(item?.male) ? Math.max(0, Math.trunc(item.male)) : 0,
          female: Number.isFinite(item?.female) ? Math.max(0, Math.trunc(item.female)) : 0,
          total: Number.isFinite(item?.total) ? Math.max(0, Math.trunc(item.total)) : 0,
          households: Number.isFinite(item?.households) ? Math.max(0, Math.trunc(item.households)) : 0,
          populationCategory: item?.populationCategory?.trim() || "Belum ditentukan",
        }))
      : defaultSiteData.populationDashboard.neighborhoods,
  };

  const defaultMapLocationsById = new Map(
    defaultSiteData.mapLocations.map((item) => [item.id, item])
  );

  const mapLocations: MapLocation[] = (
    Array.isArray(candidate.mapLocations)
      ? candidate.mapLocations
      : defaultSiteData.mapLocations
  ).map((item, index) => {
    const fallback =
      (item?.id ? defaultMapLocationsById.get(item.id) : undefined) ||
      defaultSiteData.mapLocations[index];

    const latitude =
      typeof item?.latitude === "number" &&
      Number.isFinite(item.latitude) &&
      item.latitude >= -90 &&
      item.latitude <= 90
        ? item.latitude
        : fallback?.latitude ?? null;

    const longitude =
      typeof item?.longitude === "number" &&
      Number.isFinite(item.longitude) &&
      item.longitude >= -180 &&
      item.longitude <= 180
        ? item.longitude
        : fallback?.longitude ?? null;

    return {
      ...fallback,
      ...item,
      id: item?.id?.trim() || fallback?.id || `peta-${index + 1}`,
      name: item?.name?.trim() || fallback?.name || `Lokasi ${index + 1}`,
      category:
        item?.category?.trim() ||
        fallback?.category ||
        "Fasilitas Umum",
      description:
        item?.description?.trim() ||
        fallback?.description ||
        "Deskripsi lokasi belum diisi. Perbarui melalui CMS sebelum dipublikasikan.",
      latitude,
      longitude,
      generalLocation:
        item?.generalLocation?.trim() ||
        fallback?.generalLocation ||
        "Benteng Selatan",
      mapsUrl: normalizeExternalUrl(
        item?.mapsUrl,
        fallback?.mapsUrl || ""
      ),
      status: item?.status === "published" ? "published" : "draft",
    };
  });

  const sourceStories = candidate.stories || defaultSiteData.stories;
  const alreadyFeatured = sourceStories.some((story) => Boolean(story.featured));
  const fallbackDate = input.updatedAt?.slice(0, 10) || "";
  const stories: StoryItem[] = sourceStories.map((story, index) => ({
    id: story.id,
    slug: story.slug,
    title: story.title,
    category: normalizeCategory(story.category),
    excerpt: story.excerpt,
    content: story.content,
    image: story.image,
    generalLocation: story.generalLocation,
    source: story.source,
    articleType: STORY_TYPES.includes(story.articleType as (typeof STORY_TYPES)[number])
      ? story.articleType as StoryItem["articleType"]
      : "article",
    publishedAt: story.publishedAt || fallbackDate,
    eventDate: story.eventDate || "",
    featured: Boolean(story.featured || (!alreadyFeatured && index === 0)),
    status: story.status,
  }));

  return {
    ...input,
    site,
    profile,
    contact,
    services,
    socialStatistics,
    socialContent,
    socialDashboard: dashboard,
    populationDashboard,
    mapLocations,
    stories,
  };
}
