import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  FileText,
  HeartHandshake,
  Landmark,
  MapPinned,
  ShieldCheck,
  Store,
  Users
} from "lucide-react";
import { SectionHeading } from "@/components/public/SectionHeading";
import { getSiteData } from "@/lib/cms";
import { formatPercentage, socialDashboardTotals } from "@/lib/social-dashboard";

export const dynamic = "force-dynamic";

function storyTimestamp(value: string) {
  const time = value ? new Date(`${value}T00:00:00`).getTime() : 0;
  return Number.isNaN(time) ? 0 : time;
}

function displayDate(value: string) {
  if (!value) return "Tanggal belum diisi";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default async function HomePage() {
  const data = await getSiteData();
  const services = data.services.filter((item) => item.status === "published");
  const umkm = data.umkm.filter((item) => item.status === "published");
  const locations = data.mapLocations.filter((item) => item.status === "published");
  const stories = data.stories
    .filter((item) => item.status === "published")
    .sort((a, b) => storyTimestamp(b.publishedAt) - storyTimestamp(a.publishedAt));
  const social = data.socialDashboard;
  const socialTotals = socialDashboardTotals(social);

  const quickLinks = [
    { href: "/layanan", label: "Layanan Publik", description: "Syarat dan alur pelayanan", icon: FileText },
    { href: "/kesejahteraan", label: "Kesejahteraan Sosial", description: "Persentase bantuan dan desil", icon: HeartHandshake },
    { href: "/umkm", label: "UMKM Lokal", description: "Direktori usaha dan produk", icon: Store },
    { href: "/peta", label: "Peta Digital", description: "Fasilitas dan potensi wilayah", icon: MapPinned },
    { href: "/kontak", label: "Kontak Kelurahan", description: "Kanal informasi resmi", icon: Building2 }
  ];

  return (
    <>
      <section className="home-hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(3,35,36,.94), rgba(4,58,57,.72), rgba(4,58,57,.18)), url(${data.site.heroImage})` }}>
        <div className="container home-hero-content">
          <span className="hero-kicker"><Landmark size={16} /> Portal Informasi Kelurahan</span>
          <h1>{data.site.tagline}</h1>
          <p>{data.site.description}</p>
          <div className="hero-actions">
            <Link href={data.site.primaryCtaHref} className="button button-primary">{data.site.primaryCtaLabel} <ArrowRight size={18} /></Link>
            <Link href={data.site.secondaryCtaHref} className="button button-secondary">{data.site.secondaryCtaLabel}</Link>
          </div>
          <div className="hero-trust"><ShieldCheck size={18} /> Informasi publik tanpa menampilkan data pribadi warga.</div>
        </div>
      </section>

      <section className="quick-access-section">
        <div className="container quick-access-grid">
          {quickLinks.map(({ href, label, description, icon: Icon }) => (
            <Link href={href} className="quick-card" key={href}>
              <span className="icon-box"><Icon size={22} /></span>
              <span><strong>{label}</strong><small>{description}</small></span>
              <ArrowRight size={18} />
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="container split-feature">
          <div className="feature-image"><img src={data.profile.image} alt="Ilustrasi profil Benteng Selatan" /></div>
          <div className="feature-copy">
            <span className="eyebrow">Profil Wilayah</span>
            <h2>{data.profile.heading}</h2>
            <p>{data.profile.description}</p>
            <p>{data.profile.communityOverview}</p>
            <div className="mini-list">
              {data.profile.potentials.slice(0, 4).map((item) => <span key={item}><span>✓</span>{item}</span>)}
            </div>
            <Link href="/profil" className="text-link">Baca profil kelurahan <ArrowRight size={17} /></Link>
          </div>
        </div>
      </section>

      <section className="section section-tinted">
        <div className="container">
          <SectionHeading eyebrow="Informasi Ringkas" title="Akses cepat ke isi portal" description="Angka berikut dihitung dari konten berstatus terbit di CMS." />
          <div className="stats-grid">
            <article><FileText size={25} /><strong>{services.length}</strong><span>Layanan tersedia</span></article>
            <article><Store size={25} /><strong>{umkm.length}</strong><span>UMKM terdata</span></article>
            <article><MapPinned size={25} /><strong>{locations.length}</strong><span>Lokasi publik</span></article>
            <article><Users size={25} /><strong>{stories.length}</strong><span>Artikel Kabar</span></article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading eyebrow="Ekonomi Lokal" title="UMKM dan produk masyarakat" description="Direktori usaha dapat diperbarui oleh admin setelah memperoleh izin publikasi." href="/umkm" linkLabel="Buka direktori" />
          <div className="card-grid card-grid-3">
            {umkm.slice(0, 3).map((item) => (
              <article className="media-card" key={item.id}>
                <img src={item.image || "/images/umkm-placeholder.svg"} alt={`Produk ${item.name}`} />
                <div className="media-card-body">
                  <span className="category-label"><Store size={15} /> {item.category}</span>
                  <h3>{item.name}</h3>
                  <strong>{item.featuredProduct}</strong>
                  <p>{item.description}</p>
                  <Link href={`/umkm/${item.slug}`} className="text-link">Lihat profil <ArrowRight size={16} /></Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-dark">
        <div className="container social-preview">
          <div>
            <span className="eyebrow light">Kesejahteraan Sosial</span>
            <h2>Persentase bantuan dan desil dalam data agregat.</h2>
            <p>{data.socialContent.intro}</p>
            <Link href="/kesejahteraan" className="button button-light">Lihat informasi sosial <ArrowRight size={18} /></Link>
          </div>
          <div className="social-preview-stats">
            <article><strong>{formatPercentage(social.pbiJk.yes, social.totalRecords)}</strong><span>Penerima PBI-JK</span><small>{social.pbiJk.period}</small></article>
            <article><strong>{formatPercentage(socialTotals.pkhRecipients, social.totalRecords)}</strong><span>Terdata PKH</span><small>{social.pkh.period}</small></article>
            <article><strong>{formatPercentage(socialTotals.sembakoRecipients, social.totalRecords)}</strong><span>Terdata Sembako</span><small>{social.sembako.period}</small></article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading eyebrow="Informasi Kelurahan" title="Kabar terbaru" description="Kegiatan, pengumuman, pelayanan, pembangunan, potensi, serta wisata dan budaya dalam satu kanal." href="/wisata" linkLabel="Lihat semua Kabar" />
          <div className="card-grid card-grid-2">
            {stories.slice(0, 2).map((story) => (
              <article className="story-card" key={story.id}>
                <img src={story.image || "/images/story-placeholder.svg"} alt={story.title} />
                <div><span className="category-label">{story.category}</span><h3>{story.title}</h3><p>{story.excerpt}</p><small className="card-meta"><CalendarDays size={15} /> {displayDate(story.publishedAt)}</small><Link className="text-link" href={`/wisata/${story.slug}`}>Baca Kabar <ArrowRight size={16} /></Link></div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
