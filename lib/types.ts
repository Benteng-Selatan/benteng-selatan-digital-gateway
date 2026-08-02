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
  bestiUrl: string;
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

export interface ContactPerson {
  id: string;
  name: string;
  role: string;
  phone: string;
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
  officials: ContactPerson[];
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
  featured: boolean;
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

export interface SocialDashboard {
  totalRecords: number;
  period: string;
  source: string;
  note: string;
  status: PublishStatus;
  pbiJk: {
    yes: number;
    no: number;
    period: string;
  };
  pkh: {
    no: number;
    family: number;
    administrator: number;
    period: string;
  };
  sembako: {
    no: number;
    family: number;
    administrator: number;
    period: string;
  };
  deciles: {
    d1: number;
    d2: number;
    d3: number;
    d4: number;
    d5: number;
  };
}


export interface PopulationAgeGroup {
  id: string;
  label: string;
  value: number;
}

export interface PopulationNeighborhood {
  id: string;
  rw: string;
  rt: number;
  male: number;
  female: number;
  total: number;
  households: number;
  populationCategory: string;
}

export interface PopulationDashboard {
  status: PublishStatus;
  period: string;
  source: string;
  note: string;
  isSimulation: boolean;
  totalPopulation: number;
  male: number;
  female: number;
  households: number;
  totalRt: number;
  totalRw: number;
  ageGroups: PopulationAgeGroup[];
  neighborhoods: PopulationNeighborhood[];
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

export const STORY_CATEGORIES = [
  "Kegiatan Kelurahan",
  "Pelayanan Publik",
  "Pengumuman",
  "Pembangunan",
  "Sosial & Kesejahteraan",
  "Keamanan & Lingkungan",
  "UMKM & Ekonomi",
  "Pendidikan & Pemuda",
  "Wisata & Budaya",
  "Prestasi Warga",
] as const;

export const STORY_TYPES = ["article", "announcement", "agenda"] as const;
export type StoryType = (typeof STORY_TYPES)[number];

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
  articleType: StoryType;
  publishedAt: string;
  eventDate: string;
  featured: boolean;
  status: PublishStatus;
}

export interface SiteData {
  site: SiteSettings;
  profile: ProfileData;
  contact: ContactData;
  services: ServiceItem[];
  socialStatistics: SocialStatistic[];
  socialDashboard: SocialDashboard;
  populationDashboard: PopulationDashboard;
  socialContent: SocialContent;
  umkm: UmkmItem[];
  mapLocations: MapLocation[];
  stories: StoryItem[];
  updatedAt: string;
}
