import seedData from "../data/site-data.seed.json";
import { STORY_TYPES } from "./types";
import type {
  ContactData,
  ServiceItem,
  SiteData,
  SiteSettings,
  SocialDashboard,
  StoryItem,
} from "./types";

export const defaultSiteData = seedData as SiteData;

function normalizeCategory(category: string): string {
  const value = category.trim();
  if (/wisata|budaya|kearifan|sejarah/i.test(value)) return "Wisata & Budaya";
  return value || "Kegiatan Kelurahan";
}

function normalizeExternalUrl(value: string | undefined, fallback: string): string {
  try {
    const url = new URL(value || fallback);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}

export function normalizeSiteData(input: SiteData): SiteData {
  const candidate = input as SiteData & {
    site?: Partial<SiteSettings>;
    contact?: Partial<ContactData>;
    services?: Array<Partial<ServiceItem> & Pick<ServiceItem, "id" | "slug" | "name" | "shortDescription" | "requirements" | "steps" | "serviceHours" | "location" | "contact" | "note" | "status">>;
    socialDashboard?: Partial<SocialDashboard>;
    stories?: Array<Partial<StoryItem> & Pick<StoryItem, "id" | "slug" | "title" | "category" | "excerpt" | "content" | "image" | "generalLocation" | "source" | "status">>;
  };

  const site: SiteSettings = {
    ...defaultSiteData.site,
    ...candidate.site,
    bestiUrl: normalizeExternalUrl(candidate.site?.bestiUrl, defaultSiteData.site.bestiUrl),
  };
  const contact: ContactData = {
    ...defaultSiteData.contact,
    ...candidate.contact,
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
        featured: typeof service.featured === "boolean" ? service.featured : Boolean(fallback?.featured),
      } as ServiceItem;
    }),
    ...defaultSiteData.services.filter((service) => service.featured && !existingServiceSlugs.has(service.slug)),
  ];

  const rawDashboard = candidate.socialDashboard;
  const dashboard: SocialDashboard = {
    ...defaultSiteData.socialDashboard,
    ...rawDashboard,
    pbiJk: { ...defaultSiteData.socialDashboard.pbiJk, ...rawDashboard?.pbiJk },
    pkh: { ...defaultSiteData.socialDashboard.pkh, ...rawDashboard?.pkh },
    sembako: { ...defaultSiteData.socialDashboard.sembako, ...rawDashboard?.sembako },
    deciles: { ...defaultSiteData.socialDashboard.deciles, ...rawDashboard?.deciles },
  };

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
    contact,
    services,
    socialDashboard: dashboard,
    stories,
  };
}
