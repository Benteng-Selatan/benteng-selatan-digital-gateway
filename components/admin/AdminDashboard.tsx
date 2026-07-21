"use client";

import Link from "next/link";
import {
  Building2,
  Check,
  FileText,
  Globe2,
  HeartHandshake,
  ImageUp,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  MapPinned,
  Plus,
  Save,
  Store,
  Trash2,
  UserRoundCog
} from "lucide-react";
import { ChangeEvent, ReactNode, useMemo, useState } from "react";
import type {
  ContactData,
  MapLocation,
  ProfileData,
  PublishStatus,
  ServiceItem,
  SiteData,
  SiteSettings,
  SocialContent,
  SocialStatistic,
  StoryItem,
  UmkmItem
} from "@/lib/types";

type TabKey = "overview" | "identity" | "services" | "social" | "umkm" | "map" | "stories" | "contact";

const tabItems: { key: TabKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "overview", label: "Ringkasan", icon: LayoutDashboard },
  { key: "identity", label: "Identitas & Profil", icon: Building2 },
  { key: "services", label: "Layanan Publik", icon: FileText },
  { key: "social", label: "Kesejahteraan", icon: HeartHandshake },
  { key: "umkm", label: "UMKM", icon: Store },
  { key: "map", label: "Peta Digital", icon: MapPinned },
  { key: "stories", label: "Wisata & Budaya", icon: Globe2 },
  { key: "contact", label: "Kontak", icon: UserRoundCog }
];

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function lines(value: string): string[] {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

function Input({ label, value, onChange, type = "text", placeholder, help }: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  help?: string;
}) {
  return <div className="field"><label>{label}</label><input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />{help ? <small>{help}</small> : null}</div>;
}

function Textarea({ label, value, onChange, help, rows = 4 }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  help?: string;
  rows?: number;
}) {
  return <div className="field"><label>{label}</label><textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} />{help ? <small>{help}</small> : null}</div>;
}

function SelectStatus({ value, onChange }: { value: PublishStatus; onChange: (value: PublishStatus) => void }) {
  return <div className="field"><label>Status publikasi</label><select value={value} onChange={(event) => onChange(event.target.value as PublishStatus)}><option value="published">Terbit</option><option value="draft">Draft</option></select></div>;
}

function StatusBadge({ value }: { value: PublishStatus }) {
  return <span className={`status-badge ${value}`}>{value === "published" ? "Terbit" : "Draft"}</span>;
}

function ImageField({ value, onChange, label = "Gambar" }: { value: string; onChange: (value: string) => void; label?: string }) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch("/api/cms/upload", { method: "POST", body: formData });
      const payload = await response.json() as { url?: string; message?: string };
      if (!response.ok || !payload.url) throw new Error(payload.message || "Upload gagal.");
      onChange(payload.url);
      setMessage("Gambar berhasil diunggah.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Upload gagal.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="field full">
      <label>{label}</label>
      <div className="image-upload-row">
        <img src={value || "/images/profile-placeholder.svg"} alt="Pratinjau gambar" />
        <div>
          <Input label="Path atau URL gambar" value={value} onChange={onChange} placeholder="https://...public.blob.vercel-storage.com/gambar.jpg" />
          <div className="upload-control"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} disabled={uploading} />{uploading ? <span><LoaderCircle size={16} className="loading-spin" /> Mengunggah...</span> : null}</div>
          {message ? <small>{message}</small> : null}
        </div>
      </div>
    </div>
  );
}

function ListPanel({ title, subtitle, status, onDelete, children }: {
  title: string;
  subtitle: string;
  status: PublishStatus;
  onDelete: () => void;
  children: ReactNode;
}) {
  return (
    <details className="admin-item">
      <summary className="admin-item-summary">
        <div><StatusBadge value={status} /><h3>{title}</h3><p>{subtitle}</p></div>
        <div className="admin-item-actions"><button type="button" className="icon-button danger" aria-label={`Hapus ${title}`} onClick={(event) => { event.preventDefault(); if (window.confirm(`Hapus ${title}?`)) onDelete(); }}><Trash2 size={17} /></button></div>
      </summary>
      <div className="admin-form-box">{children}</div>
    </details>
  );
}

export function AdminDashboard({ initialData }: { initialData: SiteData }) {
  const [data, setData] = useState(initialData);
  const [tab, setTab] = useState<TabKey>("overview");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Belum ada perubahan yang disimpan pada sesi ini.");

  const counts = useMemo(() => ({
    services: data.services.length,
    umkm: data.umkm.length,
    map: data.mapLocations.length,
    stories: data.stories.length
  }), [data]);

  function updateSite<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) { setData((current) => ({ ...current, site: { ...current.site, [key]: value } })); }
  function updateProfile<K extends keyof ProfileData>(key: K, value: ProfileData[K]) { setData((current) => ({ ...current, profile: { ...current.profile, [key]: value } })); }
  function updateContact<K extends keyof ContactData>(key: K, value: ContactData[K]) { setData((current) => ({ ...current, contact: { ...current.contact, [key]: value } })); }
  function updateSocialContent<K extends keyof SocialContent>(key: K, value: SocialContent[K]) { setData((current) => ({ ...current, socialContent: { ...current.socialContent, [key]: value } })); }
  function updateService(index: number, patch: Partial<ServiceItem>) { setData((current) => ({ ...current, services: current.services.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) })); }
  function updateSocial(index: number, patch: Partial<SocialStatistic>) { setData((current) => ({ ...current, socialStatistics: current.socialStatistics.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) })); }
  function updateUmkm(index: number, patch: Partial<UmkmItem>) { setData((current) => ({ ...current, umkm: current.umkm.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) })); }
  function updateMap(index: number, patch: Partial<MapLocation>) { setData((current) => ({ ...current, mapLocations: current.mapLocations.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) })); }
  function updateStory(index: number, patch: Partial<StoryItem>) { setData((current) => ({ ...current, stories: current.stories.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) })); }

  async function save() {
    setSaving(true);
    setSaveStatus("Menyimpan perubahan...");
    try {
      const response = await fetch("/api/cms/content", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const payload = await response.json() as { data?: SiteData; message?: string };
      if (!response.ok || !payload.data) throw new Error(payload.message || "Gagal menyimpan data.");
      setData(payload.data);
      setSaveStatus(`Tersimpan pada ${new Date(payload.data.updatedAt).toLocaleString("id-ID")}.`);
    } catch (reason) {
      setSaveStatus(reason instanceof Error ? reason.message : "Gagal menyimpan data.");
    } finally {
      setSaving(false);
    }
  }

  async function logout() { await fetch("/api/cms/logout", { method: "POST" }); window.location.href = "/admin/login"; }

  function addService() { setData((current) => ({ ...current, services: [...current.services, { id: generateId("layanan"), slug: "layanan-baru", name: "Layanan Baru", shortDescription: "", requirements: [], steps: [], serviceHours: "", location: "", contact: "", note: "", status: "draft" }] })); }
  function addSocial() { setData((current) => ({ ...current, socialStatistics: [...current.socialStatistics, { id: generateId("sosial"), category: "Kategori Baru", value: 0, description: "", year: "", source: "", status: "draft" }] })); }
  function addUmkm() { setData((current) => ({ ...current, umkm: [...current.umkm, { id: generateId("umkm"), slug: "umkm-baru", name: "UMKM Baru", category: "Lainnya", featuredProduct: "", description: "", image: "/images/umkm-placeholder.svg", publicContact: "", contactApproved: false, generalLocation: "Benteng Selatan", instagram: "", marketplace: "", status: "draft" }] })); }
  function addMap() { setData((current) => ({ ...current, mapLocations: [...current.mapLocations, { id: generateId("peta"), name: "Lokasi Baru", category: "Fasilitas Umum", description: "", latitude: null, longitude: null, generalLocation: "Benteng Selatan", mapsUrl: "", status: "draft" }] })); }
  function addStory() { setData((current) => ({ ...current, stories: [...current.stories, { id: generateId("cerita"), slug: "cerita-baru", title: "Cerita Baru", category: "Kearifan Lokal", excerpt: "", content: "", image: "/images/story-placeholder.svg", generalLocation: "Benteng Selatan", source: "", status: "draft" }] })); }

  return (
    <div className="admin-shell">
      <header className="admin-topbar"><div className="container admin-topbar-inner"><div className="brand"><span className="brand-mark">BS</span><span><strong>CMS Benteng Selatan</strong><small>PostgreSQL & Vercel Blob</small></span></div><div className="admin-topbar-actions"><Link href="/admin/operasional" className="button button-primary"><FileText size={17} /><span>Layanan warga</span></Link><Link href="/" target="_blank" className="button button-outline"><Globe2 size={17} /><span>Lihat website</span></Link><button className="icon-button" type="button" onClick={logout} aria-label="Keluar"><LogOut size={18} /></button></div></div></header>
      <div className="container admin-layout">
        <aside className="admin-sidebar">{tabItems.map(({ key, label, icon: Icon }) => <button key={key} type="button" className={tab === key ? "active" : ""} onClick={() => setTab(key)}><Icon size={18} /> {label}</button>)}</aside>
        <main className="admin-content">
          <div className="admin-page-heading"><h1>{tabItems.find((item) => item.key === tab)?.label}</h1><p>Kelola konten, status publikasi, dan informasi yang muncul pada portal.</p></div>

          {tab === "overview" ? <>
            <div className="stats-grid"><article><FileText size={25} /><strong>{counts.services}</strong><span>Layanan</span></article><article><Store size={25} /><strong>{counts.umkm}</strong><span>UMKM</span></article><article><MapPinned size={25} /><strong>{counts.map}</strong><span>Lokasi peta</span></article><article><Globe2 size={25} /><strong>{counts.stories}</strong><span>Cerita lokal</span></article></div>
            <section className="admin-panel" style={{ marginTop: 20 }}><div className="admin-panel-header"><div><h2>Status konten</h2><p>Konten draft tetap tersimpan tetapi tidak muncul pada website publik.</p></div></div><div className="two-column-content"><article className="notice success"><Check size={20} /><div><strong>Data aktif</strong><p>Database: PostgreSQL</p></div></article><article className="notice"><ImageUp size={20} /><div><strong>Media Cloud</strong><p>Penyimpanan: Vercel Blob</p></div></article></div></section>
          </> : null}

          {tab === "identity" ? <>
            <section className="admin-panel"><div className="admin-panel-header"><div><h2>Identitas website</h2><p>Judul, deskripsi, tombol hero, dan gambar utama.</p></div></div><div className="admin-grid">
              <Input label="Nama website" value={data.site.name} onChange={(value) => updateSite("name", value)} />
              <Input label="Nama wilayah" value={data.site.kelurahan} onChange={(value) => updateSite("kelurahan", value)} />
              <Textarea label="Tagline utama" value={data.site.tagline} onChange={(value) => updateSite("tagline", value)} />
              <Textarea label="Deskripsi website" value={data.site.description} onChange={(value) => updateSite("description", value)} />
              <Input label="Label tombol utama" value={data.site.primaryCtaLabel} onChange={(value) => updateSite("primaryCtaLabel", value)} />
              <Input label="URL tombol utama" value={data.site.primaryCtaHref} onChange={(value) => updateSite("primaryCtaHref", value)} />
              <Input label="Label tombol kedua" value={data.site.secondaryCtaLabel} onChange={(value) => updateSite("secondaryCtaLabel", value)} />
              <Input label="URL tombol kedua" value={data.site.secondaryCtaHref} onChange={(value) => updateSite("secondaryCtaHref", value)} />
              <ImageField label="Gambar hero" value={data.site.heroImage} onChange={(value) => updateSite("heroImage", value)} />
            </div></section>
            <section className="admin-panel"><div className="admin-panel-header"><div><h2>Profil kelurahan</h2><p>Konten utama halaman profil.</p></div></div><div className="admin-grid">
              <Input label="Judul profil" value={data.profile.heading} onChange={(value) => updateProfile("heading", value)} />
              <Input label="Nama pimpinan" value={data.profile.leaderName} onChange={(value) => updateProfile("leaderName", value)} />
              <Textarea label="Deskripsi wilayah" value={data.profile.description} onChange={(value) => updateProfile("description", value)} />
              <Textarea label="Gambaran masyarakat" value={data.profile.communityOverview} onChange={(value) => updateProfile("communityOverview", value)} />
              <Textarea label="Potensi wilayah" value={data.profile.potentials.join("\n")} onChange={(value) => updateProfile("potentials", lines(value))} help="Satu item per baris." />
              <Textarea label="Fasilitas utama" value={data.profile.facilities.join("\n")} onChange={(value) => updateProfile("facilities", lines(value))} help="Satu item per baris." />
              <Textarea label="Keterangan pemerintahan" value={data.profile.governmentDescription} onChange={(value) => updateProfile("governmentDescription", value)} />
              <ImageField label="Gambar profil" value={data.profile.image} onChange={(value) => updateProfile("image", value)} />
            </div></section>
          </> : null}

          {tab === "services" ? <section className="admin-panel"><div className="admin-panel-header"><div><h2>Daftar layanan</h2><p>Persyaratan dan alur ditulis satu item per baris.</p></div><button type="button" className="button button-outline" onClick={addService}><Plus size={17} /> Tambah layanan</button></div><div className="admin-list">{data.services.map((item, index) => <ListPanel key={item.id} title={item.name} subtitle={item.shortDescription || "Belum ada deskripsi"} status={item.status} onDelete={() => setData((current) => ({ ...current, services: current.services.filter((_, itemIndex) => itemIndex !== index) }))}><div className="admin-grid">
            <Input label="Nama layanan" value={item.name} onChange={(value) => updateService(index, { name: value, slug: item.slug === "layanan-baru" ? slugify(value) : item.slug })} />
            <Input label="Slug URL" value={item.slug} onChange={(value) => updateService(index, { slug: slugify(value) })} />
            <Textarea label="Deskripsi singkat" value={item.shortDescription} onChange={(value) => updateService(index, { shortDescription: value })} />
            <Textarea label="Persyaratan" value={item.requirements.join("\n")} onChange={(value) => updateService(index, { requirements: lines(value) })} />
            <Textarea label="Alur pelayanan" value={item.steps.join("\n")} onChange={(value) => updateService(index, { steps: lines(value) })} />
            <Input label="Jam pelayanan" value={item.serviceHours} onChange={(value) => updateService(index, { serviceHours: value })} />
            <Input label="Lokasi" value={item.location} onChange={(value) => updateService(index, { location: value })} />
            <Input label="Kontak resmi" value={item.contact} onChange={(value) => updateService(index, { contact: value })} />
            <Textarea label="Catatan" value={item.note} onChange={(value) => updateService(index, { note: value })} />
            <SelectStatus value={item.status} onChange={(value) => updateService(index, { status: value })} />
          </div></ListPanel>)}</div></section> : null}

          {tab === "social" ? <>
            <section className="admin-panel"><div className="admin-panel-header"><div><h2>Statistik agregat</h2><p>Jangan masukkan nama, NIK, alamat, atau data individual warga.</p></div><button type="button" className="button button-outline" onClick={addSocial}><Plus size={17} /> Tambah statistik</button></div><div className="admin-list">{data.socialStatistics.map((item, index) => <ListPanel key={item.id} title={item.category} subtitle={`${item.value.toLocaleString("id-ID")} · ${item.year || "tahun belum diisi"}`} status={item.status} onDelete={() => setData((current) => ({ ...current, socialStatistics: current.socialStatistics.filter((_, itemIndex) => itemIndex !== index) }))}><div className="admin-grid">
              <Input label="Kategori" value={item.category} onChange={(value) => updateSocial(index, { category: value })} />
              <Input label="Jumlah agregat" type="number" value={item.value} onChange={(value) => updateSocial(index, { value: Number(value) || 0 })} />
              <Textarea label="Keterangan" value={item.description} onChange={(value) => updateSocial(index, { description: value })} />
              <Input label="Tahun data" value={item.year} onChange={(value) => updateSocial(index, { year: value })} />
              <Input label="Sumber data" value={item.source} onChange={(value) => updateSocial(index, { source: value })} />
              <SelectStatus value={item.status} onChange={(value) => updateSocial(index, { status: value })} />
            </div></ListPanel>)}</div></section>
            <section className="admin-panel"><div className="admin-panel-header"><div><h2>Narasi sosial</h2><p>Gunakan narasi anonim dan informasi rujukan umum.</p></div></div><div className="admin-grid">
              <Textarea label="Pengantar" value={data.socialContent.intro} onChange={(value) => updateSocialContent("intro", value)} />
              <Textarea label="Catatan privasi" value={data.socialContent.privacyNote} onChange={(value) => updateSocialContent("privacyNote", value)} />
              <Textarea label="Hambatan akses layanan" value={data.socialContent.accessBarriers.join("\n")} onChange={(value) => updateSocialContent("accessBarriers", lines(value))} />
              <Textarea label="Rekomendasi umum" value={data.socialContent.recommendations.join("\n")} onChange={(value) => updateSocialContent("recommendations", lines(value))} />
              <Textarea label="Alur layanan sosial" value={data.socialContent.serviceFlow.join("\n")} onChange={(value) => updateSocialContent("serviceFlow", lines(value))} />
              <Input label="Kontak rujukan" value={data.socialContent.referralContact} onChange={(value) => updateSocialContent("referralContact", value)} />
            </div></section>
          </> : null}

          {tab === "umkm" ? <section className="admin-panel"><div className="admin-panel-header"><div><h2>Direktori UMKM</h2><p>Kontak hanya ditampilkan jika opsi izin publikasi diaktifkan.</p></div><button type="button" className="button button-outline" onClick={addUmkm}><Plus size={17} /> Tambah UMKM</button></div><div className="admin-list">{data.umkm.map((item, index) => <ListPanel key={item.id} title={item.name} subtitle={`${item.category} · ${item.generalLocation}`} status={item.status} onDelete={() => setData((current) => ({ ...current, umkm: current.umkm.filter((_, itemIndex) => itemIndex !== index) }))}><div className="admin-grid">
            <Input label="Nama usaha" value={item.name} onChange={(value) => updateUmkm(index, { name: value, slug: item.slug === "umkm-baru" ? slugify(value) : item.slug })} />
            <Input label="Slug URL" value={item.slug} onChange={(value) => updateUmkm(index, { slug: slugify(value) })} />
            <Input label="Kategori" value={item.category} onChange={(value) => updateUmkm(index, { category: value })} />
            <Input label="Produk unggulan" value={item.featuredProduct} onChange={(value) => updateUmkm(index, { featuredProduct: value })} />
            <Textarea label="Deskripsi" value={item.description} onChange={(value) => updateUmkm(index, { description: value })} />
            <Input label="Lokasi umum" value={item.generalLocation} onChange={(value) => updateUmkm(index, { generalLocation: value })} />
            <Input label="Kontak publik" value={item.publicContact} onChange={(value) => updateUmkm(index, { publicContact: value })} help="Nomor WhatsApp tanpa data sensitif lain." />
            <div className="field"><label>Izin kontak</label><label className="checkbox-field"><input type="checkbox" checked={item.contactApproved} onChange={(event) => updateUmkm(index, { contactApproved: event.target.checked })} /> Kontak telah disetujui untuk tampil</label></div>
            <Input label="Instagram" value={item.instagram} onChange={(value) => updateUmkm(index, { instagram: value })} />
            <Input label="Marketplace" value={item.marketplace} onChange={(value) => updateUmkm(index, { marketplace: value })} />
            <SelectStatus value={item.status} onChange={(value) => updateUmkm(index, { status: value })} />
            <ImageField label="Foto produk" value={item.image} onChange={(value) => updateUmkm(index, { image: value })} />
          </div></ListPanel>)}</div></section> : null}

          {tab === "map" ? <section className="admin-panel"><div className="admin-panel-header"><div><h2>Lokasi peta</h2><p>Untuk rumah warga atau UMKM rumahan, gunakan lokasi umum dan hindari titik yang terlalu presisi.</p></div><button type="button" className="button button-outline" onClick={addMap}><Plus size={17} /> Tambah lokasi</button></div><div className="admin-list">{data.mapLocations.map((item, index) => <ListPanel key={item.id} title={item.name} subtitle={`${item.category} · ${item.generalLocation}`} status={item.status} onDelete={() => setData((current) => ({ ...current, mapLocations: current.mapLocations.filter((_, itemIndex) => itemIndex !== index) }))}><div className="admin-grid">
            <Input label="Nama lokasi" value={item.name} onChange={(value) => updateMap(index, { name: value })} />
            <Input label="Kategori" value={item.category} onChange={(value) => updateMap(index, { category: value })} />
            <Textarea label="Deskripsi" value={item.description} onChange={(value) => updateMap(index, { description: value })} />
            <Input label="Lokasi umum" value={item.generalLocation} onChange={(value) => updateMap(index, { generalLocation: value })} />
            <Input label="Latitude" type="number" value={item.latitude ?? ""} onChange={(value) => updateMap(index, { latitude: value === "" ? null : Number(value) })} />
            <Input label="Longitude" type="number" value={item.longitude ?? ""} onChange={(value) => updateMap(index, { longitude: value === "" ? null : Number(value) })} />
            <Input label="URL Google Maps" value={item.mapsUrl} onChange={(value) => updateMap(index, { mapsUrl: value })} />
            <SelectStatus value={item.status} onChange={(value) => updateMap(index, { status: value })} />
          </div></ListPanel>)}</div></section> : null}

          {tab === "stories" ? <section className="admin-panel"><div className="admin-panel-header"><div><h2>Wisata dan kearifan lokal</h2><p>Cantumkan sumber dan hindari klaim sejarah yang belum diverifikasi.</p></div><button type="button" className="button button-outline" onClick={addStory}><Plus size={17} /> Tambah cerita</button></div><div className="admin-list">{data.stories.map((item, index) => <ListPanel key={item.id} title={item.title} subtitle={`${item.category} · ${item.generalLocation}`} status={item.status} onDelete={() => setData((current) => ({ ...current, stories: current.stories.filter((_, itemIndex) => itemIndex !== index) }))}><div className="admin-grid">
            <Input label="Judul" value={item.title} onChange={(value) => updateStory(index, { title: value, slug: item.slug === "cerita-baru" ? slugify(value) : item.slug })} />
            <Input label="Slug URL" value={item.slug} onChange={(value) => updateStory(index, { slug: slugify(value) })} />
            <Input label="Kategori" value={item.category} onChange={(value) => updateStory(index, { category: value })} />
            <Input label="Lokasi umum" value={item.generalLocation} onChange={(value) => updateStory(index, { generalLocation: value })} />
            <Textarea label="Ringkasan" value={item.excerpt} onChange={(value) => updateStory(index, { excerpt: value })} />
            <Textarea label="Isi cerita" rows={8} value={item.content} onChange={(value) => updateStory(index, { content: value })} />
            <Input label="Sumber informasi" value={item.source} onChange={(value) => updateStory(index, { source: value })} />
            <SelectStatus value={item.status} onChange={(value) => updateStory(index, { status: value })} />
            <ImageField label="Foto dokumentasi" value={item.image} onChange={(value) => updateStory(index, { image: value })} />
          </div></ListPanel>)}</div></section> : null}

          {tab === "contact" ? <section className="admin-panel"><div className="admin-panel-header"><div><h2>Kontak resmi</h2><p>Gunakan nomor, email, dan media sosial yang telah disetujui untuk publikasi.</p></div></div><div className="admin-grid">
            <Textarea label="Alamat kantor" value={data.contact.address} onChange={(value) => updateContact("address", value)} />
            <Input label="Jam pelayanan" value={data.contact.serviceHours} onChange={(value) => updateContact("serviceHours", value)} />
            <Input label="Nomor telepon" value={data.contact.phone} onChange={(value) => updateContact("phone", value)} />
            <Input label="WhatsApp" value={data.contact.whatsapp} onChange={(value) => updateContact("whatsapp", value)} />
            <Input label="Email" value={data.contact.email} onChange={(value) => updateContact("email", value)} />
            <Input label="Instagram URL" value={data.contact.instagram} onChange={(value) => updateContact("instagram", value)} />
            <Input label="Facebook URL" value={data.contact.facebook} onChange={(value) => updateContact("facebook", value)} />
            <Input label="Google Maps URL" value={data.contact.mapsUrl} onChange={(value) => updateContact("mapsUrl", value)} />
          </div></section> : null}

          <div className="save-bar"><div><strong>Simpan ke database</strong><p className="save-status">{saveStatus}</p></div><button type="button" className="button button-primary" onClick={save} disabled={saving}>{saving ? <LoaderCircle size={18} className="loading-spin" /> : <Save size={18} />} {saving ? "Menyimpan..." : "Simpan perubahan"}</button></div>
        </main>
      </div>
    </div>
  );
}
