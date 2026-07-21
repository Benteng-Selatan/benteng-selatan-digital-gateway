export type PublishStatus = "published" | "draft";

export interface SiteSettings {
  name: string;
  kelurahan: string;
  tagline: string;
  description: string;
  heroImage: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
}

export interface ProfileData {
  heading: string;
  description: string;
  communityOverview: string;
  potentials: string[];
  facilities: string[];
  leaderName: string;
  governmentDescription: string;
  image: string;
}

export interface ContactData {
  address: string;
  serviceHours: string;
  phone: string;
  email: string;
  whatsapp: string;
  instagram: string;
  facebook: string;
  mapsUrl: string;
}

export interface ServiceItem {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  requirements: string[];
  steps: string[];
  serviceHours: string;
  location: string;
  contact: string;
  note: string;
  status: PublishStatus;
}

export interface SocialStatistic {
  id: string;
  category: string;
  value: number;
  description: string;
  year: string;
  source: string;
  status: PublishStatus;
}

export interface SocialContent {
  intro: string;
  accessBarriers: string[];
  recommendations: string[];
  serviceFlow: string[];
  referralContact: string;
  privacyNote: string;
}

export interface UmkmItem {
  id: string;
  slug: string;
  name: string;
  category: string;
  featuredProduct: string;
  description: string;
  image: string;
  publicContact: string;
  contactApproved: boolean;
  generalLocation: string;
  instagram: string;
  marketplace: string;
  status: PublishStatus;
}

export interface MapLocation {
  id: string;
  name: string;
  category: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  generalLocation: string;
  mapsUrl: string;
  status: PublishStatus;
}

export interface StoryItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  image: string;
  generalLocation: string;
  source: string;
  status: PublishStatus;
}

export interface SiteData {
  site: SiteSettings;
  profile: ProfileData;
  contact: ContactData;
  services: ServiceItem[];
  socialStatistics: SocialStatistic[];
  socialContent: SocialContent;
  umkm: UmkmItem[];
  mapLocations: MapLocation[];
  stories: StoryItem[];
  updatedAt: string;
}
