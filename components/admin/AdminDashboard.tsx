"use client";

import {
  Building2,
  Check,
  FileText,
  Newspaper,
  HeartHandshake,
  ImageUp,
  LayoutDashboard,
  LoaderCircle,
  MapPinned,
  Plus,
  Save,
  Store,
  Trash2,
  UserRoundCog,
  Users
} from "lucide-react";
import { ChangeEvent, ReactNode, useMemo, useState } from "react";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import type { PublicAdminSession } from "@/lib/auth";
import { formatPercentage, socialDashboardTotals, validateSocialDashboard } from "@/lib/social-dashboard";
import { validatePopulationDashboard } from "@/lib/population-dashboard";
import { STORY_CATEGORIES, STORY_TYPES } from "@/lib/types";
import type {
  ContactData,
  ContactPerson,
  MapLocation,
  PopulationDashboard,
  PopulationNeighborhood,
  ProfileData,
  PublishStatus,
  ServiceItem,
  SiteData,
  SiteSettings,
  SocialContent,
  SocialDashboard,
  StoryItem,
  StoryType,
  UmkmItem
} from "@/lib/types";

type TabKey = "overview" | "identity" | "services" | "social" | "population" | "umkm" | "map" | "stories" | "contact";

const tabItems: { key: TabKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "overview", label: "Ringkasan", icon: LayoutDashboard },
  { key: "identity", label: "Identitas & Profil", icon: Building2 },
  { key: "services", label: "Layanan Publik", icon: FileText },
  { key: "social", label: "Kesejahteraan", icon: HeartHandshake },
  { key: "population", label: "Kependudukan", icon: Users },
  { key: "umkm", label: "UMKM", icon: Store },
  { key: "map", label: "Peta Digital", icon: MapPinned },
  { key: "stories", label: "Kabar", icon: Newspaper },
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

function SelectField({ label, value, options, onChange, help }: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
  help?: string;
}) {
  const hasCurrentValue = options.some((option) => option.value === value);
  return <div className="field"><label>{label}</label><select value={value} onChange={(event) => onChange(event.target.value)}>{!hasCurrentValue ? <option value={value}>{value}</option> : null}{options.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select>{help ? <small>{help}</small> : null}</div>;
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
      const response = await fetch("/api/cms/upload", { method: "POST", headers: { "Idempotency-Key": crypto.randomUUID() }, body: formData });
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

export function AdminDashboard({ initialData, initialVersion, user }: { initialData: SiteData; initialVersion: number; user: PublicAdminSession }) {
  const [data, setData] = useState(initialData);
  const [version, setVersion] = useState(initialVersion);
  const [tab, setTab] = useState<TabKey>("overview");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Belum ada perubahan yang disimpan pada sesi ini.");

  const counts = useMemo(() => ({
    services: data.services.length,
    umkm: data.umkm.length,
    map: data.mapLocations.length,
    stories: data.stories.length
  }), [data]);
  const socialErrors = useMemo(() => validateSocialDashboard(data.socialDashboard), [data.socialDashboard]);
  const socialTotals = useMemo(() => socialDashboardTotals(data.socialDashboard), [data.socialDashboard]);
  const populationErrors = useMemo(() => validatePopulationDashboard(data.populationDashboard), [data.populationDashboard]);

  function updateSite<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) { setData((current) => ({ ...current, site: { ...current.site, [key]: value } })); }
  function updateProfile<K extends keyof ProfileData>(key: K, value: ProfileData[K]) { setData((current) => ({ ...current, profile: { ...current.profile, [key]: value } })); }
  function updateContact<K extends keyof ContactData>(key: K, value: ContactData[K]) { setData((current) => ({ ...current, contact: { ...current.contact, [key]: value } })); }
  function updateContactPerson(index: number, patch: Partial<ContactPerson>) { setData((current) => ({ ...current, contact: { ...current.contact, officials: current.contact.officials.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) } })); }
  function updateSocialContent<K extends keyof SocialContent>(key: K, value: SocialContent[K]) { setData((current) => ({ ...current, socialContent: { ...current.socialContent, [key]: value } })); }
  function updateSocialDashboard<K extends keyof SocialDashboard>(key: K, value: SocialDashboard[K]) { setData((current) => ({ ...current, socialDashboard: { ...current.socialDashboard, [key]: value } })); }
  function updatePbiJk<K extends keyof SocialDashboard["pbiJk"]>(key: K, value: SocialDashboard["pbiJk"][K]) { setData((current) => ({ ...current, socialDashboard: { ...current.socialDashboard, pbiJk: { ...current.socialDashboard.pbiJk, [key]: value } } })); }
  function updatePkh<K extends keyof SocialDashboard["pkh"]>(key: K, value: SocialDashboard["pkh"][K]) { setData((current) => ({ ...current, socialDashboard: { ...current.socialDashboard, pkh: { ...current.socialDashboard.pkh, [key]: value } } })); }
  function updateSembako<K extends keyof SocialDashboard["sembako"]>(key: K, value: SocialDashboard["sembako"][K]) { setData((current) => ({ ...current, socialDashboard: { ...current.socialDashboard, sembako: { ...current.socialDashboard.sembako, [key]: value } } })); }
  function updateDecile<K extends keyof SocialDashboard["deciles"]>(key: K, value: SocialDashboard["deciles"][K]) { setData((current) => ({ ...current, socialDashboard: { ...current.socialDashboard, deciles: { ...current.socialDashboard.deciles, [key]: value } } })); }
  function updatePopulation<K extends keyof PopulationDashboard>(key: K, value: PopulationDashboard[K]) { setData((current) => ({ ...current, populationDashboard: { ...current.populationDashboard, [key]: value } })); }
  function updateAgeGroup(index: number, patch: Partial<PopulationDashboard["ageGroups"][number]>) { setData((current) => ({ ...current, populationDashboard: { ...current.populationDashboard, ageGroups: current.populationDashboard.ageGroups.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) } })); }
  function updateNeighborhood(index: number, patch: Partial<PopulationNeighborhood>) { setData((current) => ({ ...current, populationDashboard: { ...current.populationDashboard, neighborhoods: current.populationDashboard.neighborhoods.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) } })); }

  function updateService(index: number, patch: Partial<ServiceItem>) { setData((current) => ({ ...current, services: current.services.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) })); }
  function updateUmkm(index: number, patch: Partial<UmkmItem>) { setData((current) => ({ ...current, umkm: current.umkm.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) })); }
  function updateMap(index: number, patch: Partial<MapLocation>) { setData((current) => ({ ...current, mapLocations: current.mapLocations.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) })); }
  function updateStory(index: number, patch: Partial<StoryItem>) { setData((current) => ({ ...current, stories: current.stories.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) })); }

  async function save() {
    if (data.socialDashboard.status === "published" && socialErrors.length) {
      setTab("social");
      setSaveStatus(`Data kesejahteraan belum valid: ${socialErrors[0]}`);
      return;
    }
    if (data.populationDashboard.status === "published" && populationErrors.length) {
      setTab("population");
      setSaveStatus(`Data kependudukan belum valid: ${populationErrors[0]}`);
      return;
    }
    setSaving(true);
    setSaveStatus("Menyimpan perubahan...");
    try {
      const response = await fetch("/api/cms/content", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data, expectedVersion: version }) });
      const payload = await response.json() as { data?: SiteData; version?: number; message?: string; errors?: string[] };
      if (!response.ok || !payload.data || !payload.version) throw new Error(payload.errors?.[0] || payload.message || "Gagal menyimpan data.");
      setData(payload.data);
      setVersion(payload.version);
      setSaveStatus(`Tersimpan pada ${new Date(payload.data.updatedAt).toLocaleString("id-ID")} · revisi ${payload.version}.`);
    } catch (reason) {
      setSaveStatus(reason instanceof Error ? reason.message : "Gagal menyimpan data.");
    } finally {
      setSaving(false);
    }
  }

  function addService() { setData((current) => ({ ...current, services: [...current.services, { id: generateId("layanan"), slug: "layanan-baru", name: "Layanan Baru", shortDescription: "", requirements: [], steps: [], serviceHours: "", location: "", contact: "", note: "", featured: false, status: "draft" }] })); }
  function addUmkm() { setData((current) => ({ ...current, umkm: [...current.umkm, { id: generateId("umkm"), slug: "umkm-baru", name: "UMKM Baru", category: "Lainnya", featuredProduct: "", description: "", image: "/images/umkm-placeholder.svg", publicContact: "", contactApproved: false, generalLocation: "Benteng Selatan", instagram: "", marketplace: "", status: "draft" }] })); }
  function addMap() { setData((current) => ({ ...current, mapLocations: [...current.mapLocations, { id: generateId("peta"), name: "Lokasi Baru", category: "Fasilitas Umum", description: "", latitude: null, longitude: null, generalLocation: "Benteng Selatan", mapsUrl: "", status: "draft" }] })); }
  function addStory() { setData((current) => ({ ...current, stories: [...current.stories, { id: generateId("kabar"), slug: "kabar-baru", title: "Kabar Baru", category: "Kegiatan Kelurahan", excerpt: "", content: "", image: "/images/story-placeholder.svg", generalLocation: "Benteng Selatan", source: "Kelurahan Benteng Selatan", articleType: "article", publishedAt: new Date().toISOString().slice(0, 10), eventDate: "", featured: false, status: "draft" }] })); }
  function addContactPerson() { setData((current) => ({ ...current, contact: { ...current.contact, officials: [...current.contact.officials, { id: generateId("kontak"), name: "Nama Petugas", role: "Jabatan", phone: "" }] } })); }

  return (
    <div className="admin-shell">
      <AdminToolbar title="CMS Benteng Selatan" subtitle="Konten publik" user={user} />
      <div className="container admin-layout">
        <aside className="admin-sidebar">{tabItems.map(({ key, label, icon: Icon }) => <button key={key} type="button" className={tab === key ? "active" : ""} onClick={() => setTab(key)}><Icon size={18} /> {label}</button>)}</aside>
        <main className="admin-content">
          <div className="admin-page-heading"><h1>{tabItems.find((item) => item.key === tab)?.label}</h1><p>Kelola konten, status publikasi, dan informasi yang muncul pada portal.</p></div>

          {tab === "overview" ? <>
            <div className="stats-grid"><article><FileText size={25} /><strong>{counts.services}</strong><span>Layanan</span></article><article><Store size={25} /><strong>{counts.umkm}</strong><span>UMKM</span></article><article><MapPinned size={25} /><strong>{counts.map}</strong><span>Lokasi peta</span></article><article><Newspaper size={25} /><strong>{counts.stories}</strong><span>Artikel Kabar</span></article></div>
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
              <Input label="URL aplikasi BESTI" value={data.site.bestiUrl} onChange={(value) => updateSite("bestiUrl", value)} help="Gunakan URL lengkap, misalnya https://besti.is-best.net" />
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

          {tab === "services" ? <section className="admin-panel"><div className="admin-panel-header"><div><h2>Daftar layanan</h2><p>Kelola nama dan deskripsi layanan utama. Persyaratan serta pengajuan lengkap diarahkan ke BESTI.</p></div><button type="button" className="button button-outline" onClick={addService}><Plus size={17} /> Tambah layanan</button></div><div className="admin-list">{data.services.map((item, index) => <ListPanel key={item.id} title={item.name} subtitle={item.shortDescription || "Belum ada deskripsi"} status={item.status} onDelete={() => setData((current) => ({ ...current, services: current.services.filter((_, itemIndex) => itemIndex !== index) }))}><div className="admin-grid">
            <Input label="Nama layanan" value={item.name} onChange={(value) => updateService(index, { name: value, slug: item.slug === "layanan-baru" ? slugify(value) : item.slug })} />
            <Input label="Slug URL" value={item.slug} onChange={(value) => updateService(index, { slug: slugify(value) })} />
            <Textarea label="Deskripsi singkat" value={item.shortDescription} onChange={(value) => updateService(index, { shortDescription: value })} />
            <div className="field"><label>Penempatan</label><label className="checkbox-field"><input type="checkbox" checked={item.featured} onChange={(event) => updateService(index, { featured: event.target.checked })} /> Tampilkan sebagai layanan utama</label><small>Halaman publik menampilkan maksimal 10 layanan utama.</small></div>
            <SelectStatus value={item.status} onChange={(value) => updateService(index, { status: value })} />
            <details className="admin-advanced full"><summary>Informasi tambahan/legacy</summary><div className="admin-grid">
              <Textarea label="Persyaratan" value={item.requirements.join("\n")} onChange={(value) => updateService(index, { requirements: lines(value) })} help="Tidak ditampilkan pada daftar publik; prosedur utama berada di BESTI." />
              <Textarea label="Alur pelayanan" value={item.steps.join("\n")} onChange={(value) => updateService(index, { steps: lines(value) })} help="Dipertahankan untuk kompatibilitas data lama." />
              <Input label="Jam pelayanan" value={item.serviceHours} onChange={(value) => updateService(index, { serviceHours: value })} />
              <Input label="Lokasi" value={item.location} onChange={(value) => updateService(index, { location: value })} />
              <Input label="Kontak resmi" value={item.contact} onChange={(value) => updateService(index, { contact: value })} />
              <Textarea label="Catatan" value={item.note} onChange={(value) => updateService(index, { note: value })} />
            </div></details>
          </div></ListPanel>)}</div></section> : null}

          {tab === "social" ? <>
            <section className="admin-panel"><div className="admin-panel-header"><div><h2>Dashboard bantuan dan desil</h2><p>Data awal telah diisi dari spreadsheet Benteng Selatan. Persentase dihitung otomatis dan data individu tidak disimpan di bagian ini.</p></div></div>
              <div className="admin-grid">
                <Input label="Total basis data" type="number" value={data.socialDashboard.totalRecords} onChange={(value) => updateSocialDashboard("totalRecords", Number(value) || 0)} help="Menjadi pembagi seluruh persentase." />
                <Input label="Periode umum" value={data.socialDashboard.period} onChange={(value) => updateSocialDashboard("period", value)} />
                <Input label="Sumber data" value={data.socialDashboard.source} onChange={(value) => updateSocialDashboard("source", value)} />
                <SelectStatus value={data.socialDashboard.status} onChange={(value) => updateSocialDashboard("status", value)} />
                <Textarea label="Catatan periode/metodologi" value={data.socialDashboard.note} onChange={(value) => updateSocialDashboard("note", value)} />
              </div>
              <div className={`notice compact ${socialErrors.length ? "warning" : "success"}`}><div><strong>{socialErrors.length ? "Periksa konsistensi data" : "Seluruh jumlah sesuai total"}</strong>{socialErrors.length ? <ul className="check-list">{socialErrors.map((error) => <li key={error}>{error}</li>)}</ul> : <p>PBI-JK, PKH, Sembako, dan Desil masing-masing berjumlah {data.socialDashboard.totalRecords.toLocaleString("id-ID")} data.</p>}</div></div>
            </section>

            <section className="admin-panel"><div className="admin-panel-header"><div><h2>PBI-JK</h2><p>Persentase penerima: {formatPercentage(data.socialDashboard.pbiJk.yes, data.socialDashboard.totalRecords)}.</p></div></div><div className="admin-grid">
              <Input label="Ya / penerima" type="number" value={data.socialDashboard.pbiJk.yes} onChange={(value) => updatePbiJk("yes", Number(value) || 0)} />
              <Input label="Tidak" type="number" value={data.socialDashboard.pbiJk.no} onChange={(value) => updatePbiJk("no", Number(value) || 0)} />
              <Input label="Periode PBI-JK" value={data.socialDashboard.pbiJk.period} onChange={(value) => updatePbiJk("period", value)} />
            </div></section>

            <section className="admin-panel"><div className="admin-panel-header"><div><h2>PKH</h2><p>Terdata sebagai keluarga atau pengurus: {socialTotals.pkhRecipients.toLocaleString("id-ID")} ({formatPercentage(socialTotals.pkhRecipients, data.socialDashboard.totalRecords)}).</p></div></div><div className="admin-grid">
              <Input label="Tidak" type="number" value={data.socialDashboard.pkh.no} onChange={(value) => updatePkh("no", Number(value) || 0)} />
              <Input label="Keluarga" type="number" value={data.socialDashboard.pkh.family} onChange={(value) => updatePkh("family", Number(value) || 0)} />
              <Input label="Pengurus" type="number" value={data.socialDashboard.pkh.administrator} onChange={(value) => updatePkh("administrator", Number(value) || 0)} />
              <Input label="Periode PKH" value={data.socialDashboard.pkh.period} onChange={(value) => updatePkh("period", value)} />
            </div></section>

            <section className="admin-panel"><div className="admin-panel-header"><div><h2>Sembako</h2><p>Terdata sebagai keluarga atau pengurus: {socialTotals.sembakoRecipients.toLocaleString("id-ID")} ({formatPercentage(socialTotals.sembakoRecipients, data.socialDashboard.totalRecords)}).</p></div></div><div className="admin-grid">
              <Input label="Tidak" type="number" value={data.socialDashboard.sembako.no} onChange={(value) => updateSembako("no", Number(value) || 0)} />
              <Input label="Keluarga" type="number" value={data.socialDashboard.sembako.family} onChange={(value) => updateSembako("family", Number(value) || 0)} />
              <Input label="Pengurus" type="number" value={data.socialDashboard.sembako.administrator} onChange={(value) => updateSembako("administrator", Number(value) || 0)} />
              <Input label="Periode Sembako" value={data.socialDashboard.sembako.period} onChange={(value) => updateSembako("period", value)} />
            </div></section>

            <section className="admin-panel"><div className="admin-panel-header"><div><h2>Klasifikasi desil</h2><p>Masukkan jumlah agregat untuk Desil 1 sampai Desil 5.</p></div></div><div className="admin-grid five-column-grid">
              {(["d1", "d2", "d3", "d4", "d5"] as const).map((key, index) => <Input key={key} label={`Desil ${index + 1}`} type="number" value={data.socialDashboard.deciles[key]} onChange={(value) => updateDecile(key, Number(value) || 0)} help={formatPercentage(data.socialDashboard.deciles[key], data.socialDashboard.totalRecords)} />)}
            </div></section>

            <section className="admin-panel"><div className="admin-panel-header"><div><h2>Informasi dan rujukan sosial</h2><p>Kelola pengantar, rekomendasi umum, dan kontak rujukan yang ditampilkan kepada masyarakat.</p></div></div><div className="admin-grid">
              <Textarea label="Pengantar" value={data.socialContent.intro} onChange={(value) => updateSocialContent("intro", value)} />
              <Textarea label="Keterangan data" value={data.socialContent.privacyNote} onChange={(value) => updateSocialContent("privacyNote", value)} />
              <Textarea label="Rekomendasi umum" value={data.socialContent.recommendations.join("\n")} onChange={(value) => updateSocialContent("recommendations", lines(value))} />
              <Input label="Rujukan layanan sosial" value={data.socialContent.referralContact} onChange={(value) => updateSocialContent("referralContact", value)} />
            </div></section>
          </> : null}

          {tab === "population" ? <>
            <section className="admin-panel"><div className="admin-panel-header"><div><h2>Dashboard kependudukan</h2><p>Data awal merupakan dummy dan tetap berstatus draft sampai diganti dengan data resmi yang telah diverifikasi.</p></div></div>
              <div className="admin-grid">
                <Input label="Total penduduk" type="number" value={data.populationDashboard.totalPopulation} onChange={(value) => updatePopulation("totalPopulation", Number(value) || 0)} />
                <Input label="Laki-laki" type="number" value={data.populationDashboard.male} onChange={(value) => updatePopulation("male", Number(value) || 0)} />
                <Input label="Perempuan" type="number" value={data.populationDashboard.female} onChange={(value) => updatePopulation("female", Number(value) || 0)} />
                <Input label="Kepala keluarga" type="number" value={data.populationDashboard.households} onChange={(value) => updatePopulation("households", Number(value) || 0)} />
                <Input label="Total RT" type="number" value={data.populationDashboard.totalRt} onChange={(value) => updatePopulation("totalRt", Number(value) || 0)} />
                <Input label="Total RW" type="number" value={data.populationDashboard.totalRw} onChange={(value) => updatePopulation("totalRw", Number(value) || 0)} />
                <Input label="Periode" value={data.populationDashboard.period} onChange={(value) => updatePopulation("period", value)} />
                <Input label="Sumber data" value={data.populationDashboard.source} onChange={(value) => updatePopulation("source", value)} />
                <SelectStatus value={data.populationDashboard.status} onChange={(value) => updatePopulation("status", value)} />
                <div className="field"><label>Status data</label><label className="checkbox-field"><input type="checkbox" checked={data.populationDashboard.isSimulation} onChange={(event) => updatePopulation("isSimulation", event.target.checked)} /> Data masih berupa simulasi/dummy</label><small>Data simulasi tidak dapat diterbitkan.</small></div>
                <Textarea label="Catatan data" value={data.populationDashboard.note} onChange={(value) => updatePopulation("note", value)} />
              </div>
              <div className={`notice compact ${populationErrors.length ? "warning" : "success"}`}><div><strong>{populationErrors.length ? "Periksa konsistensi data" : "Seluruh jumlah konsisten"}</strong>{populationErrors.length ? <ul className="check-list population-validation-list">{populationErrors.map((error) => <li key={error}>{error}</li>)}</ul> : <p>Total jenis kelamin, kelompok usia, dan seluruh RW sudah sesuai dengan ringkasan.</p>}</div></div>
            </section>

            <section className="admin-panel"><div className="admin-panel-header"><div><h2>Kelompok usia</h2><p>Nilai seluruh kelompok harus sama dengan total penduduk.</p></div></div><div className="admin-grid five-column-grid">
              {data.populationDashboard.ageGroups.map((item, index) => <div className="admin-form-box" key={item.id}><Input label="Label" value={item.label} onChange={(value) => updateAgeGroup(index, { label: value })} /><Input label="Jumlah" type="number" value={item.value} onChange={(value) => updateAgeGroup(index, { value: Number(value) || 0 })} /></div>)}
            </div></section>

            <section className="admin-panel"><div className="admin-panel-header"><div><h2>Data per RW</h2><p>Kolom kategori merupakan kategori jumlah penduduk, bukan kepadatan jiwa per km².</p></div></div><div className="population-table-scroll">
              <table className="population-admin-table"><thead><tr><th>RW</th><th>RT</th><th>Laki-laki</th><th>Perempuan</th><th>Total</th><th>KK</th><th>Kategori</th></tr></thead><tbody>
                {data.populationDashboard.neighborhoods.map((row, index) => <tr key={row.id}>
                  <td><input className="rw-input" value={row.rw} onChange={(event) => updateNeighborhood(index, { rw: event.target.value })} /></td>
                  <td><input type="number" value={row.rt} onChange={(event) => updateNeighborhood(index, { rt: Number(event.target.value) || 0 })} /></td>
                  <td><input type="number" value={row.male} onChange={(event) => updateNeighborhood(index, { male: Number(event.target.value) || 0, total: (Number(event.target.value) || 0) + row.female })} /></td>
                  <td><input type="number" value={row.female} onChange={(event) => updateNeighborhood(index, { female: Number(event.target.value) || 0, total: row.male + (Number(event.target.value) || 0) })} /></td>
                  <td><input type="number" value={row.total} onChange={(event) => updateNeighborhood(index, { total: Number(event.target.value) || 0 })} /></td>
                  <td><input type="number" value={row.households} onChange={(event) => updateNeighborhood(index, { households: Number(event.target.value) || 0 })} /></td>
                  <td><input value={row.populationCategory} onChange={(event) => updateNeighborhood(index, { populationCategory: event.target.value })} /></td>
                </tr>)}
              </tbody></table>
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

          {tab === "stories" ? <section className="admin-panel"><div className="admin-panel-header"><div><h2>Kabar</h2><p>Kelola artikel, kegiatan, pengumuman, agenda, pembangunan, pelayanan, serta wisata dan budaya dalam satu kanal.</p></div><button type="button" className="button button-outline" onClick={addStory}><Plus size={17} /> Tambah Kabar</button></div><div className="admin-list">{data.stories.map((item, index) => <ListPanel key={item.id} title={item.title} subtitle={`${item.category} · ${item.publishedAt || "tanggal belum diisi"}`} status={item.status} onDelete={() => setData((current) => ({ ...current, stories: current.stories.filter((_, itemIndex) => itemIndex !== index) }))}><div className="admin-grid">
            <Input label="Judul" value={item.title} onChange={(value) => updateStory(index, { title: value, slug: item.slug === "kabar-baru" || item.slug === "cerita-baru" ? slugify(value) : item.slug })} />
            <Input label="Slug URL" value={item.slug} onChange={(value) => updateStory(index, { slug: slugify(value) })} />
            <SelectField label="Jenis konten" value={item.articleType} options={STORY_TYPES.map((value) => ({ value, label: value === "article" ? "Artikel" : value === "announcement" ? "Pengumuman" : "Agenda" }))} onChange={(value) => updateStory(index, { articleType: value as StoryType })} />
            <SelectField label="Kategori" value={item.category} options={STORY_CATEGORIES.map((value) => ({ value, label: value }))} onChange={(value) => updateStory(index, { category: value })} />
            <Input label="Tanggal publikasi" type="date" value={item.publishedAt} onChange={(value) => updateStory(index, { publishedAt: value })} />
            <Input label="Tanggal kegiatan (opsional)" type="date" value={item.eventDate} onChange={(value) => updateStory(index, { eventDate: value })} />
            <Input label="Lokasi umum (opsional)" value={item.generalLocation} onChange={(value) => updateStory(index, { generalLocation: value })} />
            <Input label="Sumber informasi" value={item.source} onChange={(value) => updateStory(index, { source: value })} />
            <Textarea label="Ringkasan" value={item.excerpt} onChange={(value) => updateStory(index, { excerpt: value })} />
            <Textarea label="Isi Kabar" rows={8} value={item.content} onChange={(value) => updateStory(index, { content: value })} />
            <div className="field"><label>Penempatan</label><label className="checkbox-field"><input type="checkbox" checked={item.featured} onChange={(event) => updateStory(index, { featured: event.target.checked })} /> Jadikan Kabar utama</label><small>Jika lebih dari satu dipilih, artikel terbaru yang tampil sebagai Kabar utama.</small></div>
            <SelectStatus value={item.status} onChange={(value) => updateStory(index, { status: value })} />
            <ImageField label="Gambar sampul" value={item.image} onChange={(value) => updateStory(index, { image: value })} />
          </div></ListPanel>)}</div></section> : null}

          {tab === "contact" ? <>
            <section className="admin-panel"><div className="admin-panel-header"><div><h2>Kontak resmi</h2><p>Gunakan nomor, email, dan media sosial yang telah disetujui untuk publikasi.</p></div></div><div className="admin-grid">
              <Textarea label="Alamat kantor" value={data.contact.address} onChange={(value) => updateContact("address", value)} />
              <Input label="Jam pelayanan" value={data.contact.serviceHours} onChange={(value) => updateContact("serviceHours", value)} />
              <Input label="Nomor telepon" value={data.contact.phone} onChange={(value) => updateContact("phone", value)} />
              <Input label="WhatsApp" value={data.contact.whatsapp} onChange={(value) => updateContact("whatsapp", value)} />
              <Input label="Email" value={data.contact.email} onChange={(value) => updateContact("email", value)} />
              <Input label="Instagram URL" value={data.contact.instagram} onChange={(value) => updateContact("instagram", value)} />
              <Input label="Facebook URL" value={data.contact.facebook} onChange={(value) => updateContact("facebook", value)} />
              <Input label="Google Maps URL" value={data.contact.mapsUrl} onChange={(value) => updateContact("mapsUrl", value)} />
            </div></section>
            <section className="admin-panel"><div className="admin-panel-header"><div><h2>Kontak perangkat kelurahan</h2><p>Nama, jabatan, dan nomor yang telah mendapat izin untuk ditampilkan pada website.</p></div><button type="button" className="button button-outline" onClick={addContactPerson}><Plus size={17} /> Tambah kontak</button></div><div className="admin-list">
              {data.contact.officials.map((official, index) => <ListPanel key={official.id} title={official.name} subtitle={`${official.role} · ${official.phone || "nomor belum diisi"}`} status="published" onDelete={() => setData((current) => ({ ...current, contact: { ...current.contact, officials: current.contact.officials.filter((_, itemIndex) => itemIndex !== index) } }))}><div className="admin-grid">
                <Input label="Nama" value={official.name} onChange={(value) => updateContactPerson(index, { name: value })} />
                <Input label="Jabatan" value={official.role} onChange={(value) => updateContactPerson(index, { role: value })} />
                <Input label="Nomor telepon" value={official.phone} onChange={(value) => updateContactPerson(index, { phone: value })} />
              </div></ListPanel>)}
            </div></section>
          </> : null}

          <div className="save-bar"><div><strong>Simpan ke database</strong><p className="save-status">{saveStatus}</p></div><button type="button" className="button button-primary" onClick={save} disabled={saving}>{saving ? <LoaderCircle size={18} className="loading-spin" /> : <Save size={18} />} {saving ? "Menyimpan..." : "Simpan perubahan"}</button></div>
        </main>
      </div>
    </div>
  );
}
