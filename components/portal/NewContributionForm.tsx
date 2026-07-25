"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { CONTRIBUTION_TYPE_LABELS, type ContributionType } from "@/lib/portal-types";

export function NewContributionForm({ initialType }: { initialType: ContributionType }) {
  const [type, setType] = useState<ContributionType>(initialType);
  const [image, setImage] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  async function upload(event: ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (!file) return; const data = new FormData(); data.append("file", file); setMessage("Mengunggah gambar..."); const response = await fetch("/api/citizen/upload", { method: "POST", body: data }); const result = await response.json(); if (!response.ok) { setMessage(result.message || "Upload gagal."); return; } setImage(result.url); setMessage("Gambar berhasil diunggah."); }
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setLoading(true); setMessage(""); const formData = new FormData(event.currentTarget); const payload: Record<string, FormDataEntryValue | boolean> = Object.fromEntries(formData.entries()); payload.type = type; payload.image = image; payload.contactApproved = formData.get("contactApproved") === "true"; try { const response = await fetch("/api/citizen/submissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); const result = await response.json(); if (!response.ok) throw new Error(result.message || "Pengajuan gagal."); window.location.href = "/warga"; } catch (error) { setMessage(error instanceof Error ? error.message : "Pengajuan gagal."); } finally { setLoading(false); } }
  return <form className="portal-form portal-form-wide" onSubmit={submit}>
    <div className="field"><label>Jenis kontribusi</label><select value={type} onChange={(e) => setType(e.target.value as ContributionType)}><option value="umkm">UMKM</option><option value="tourism">Wisata & budaya</option><option value="map">Lokasi peta</option></select></div>
    <div className="form-section-title"><h2>{CONTRIBUTION_TYPE_LABELS[type]}</h2><p>Data baru tampil setelah diverifikasi dan diterbitkan petugas.</p></div>
    <div className="portal-form-grid">
      {type === "umkm" ? <>
        <div className="field"><label>Nama UMKM</label><input name="name" required /></div><div className="field"><label>Kategori</label><input name="category" required /></div><div className="field"><label>Produk unggulan</label><input name="featuredProduct" required /></div><div className="field"><label>Kontak publik</label><input name="publicContact" /></div><div className="field full"><label>Deskripsi</label><textarea name="description" required minLength={20} rows={5} /></div><div className="field full"><label>Lokasi umum</label><input name="generalLocation" required /></div><div className="field"><label>Instagram</label><input name="instagram" /></div><div className="field"><label>Marketplace</label><input name="marketplace" /></div><label className="checkbox-field full"><input type="checkbox" name="contactApproved" value="true" /> Saya menyetujui kontak ditampilkan kepada publik.</label>
      </> : type === "tourism" ? <>
        <div className="field"><label>Nama/judul potensi</label><input name="title" required /></div><div className="field"><label>Kategori</label><input name="category" required placeholder="Wisata, budaya, kuliner, sejarah" /></div><div className="field full"><label>Ringkasan</label><textarea name="excerpt" rows={3} /></div><div className="field full"><label>Uraian lengkap</label><textarea name="content" required minLength={30} rows={7} /></div><div className="field"><label>Lokasi umum</label><input name="generalLocation" required /></div><div className="field"><label>Sumber informasi</label><input name="source" /></div>
      </> : <>
        <div className="field"><label>Nama lokasi</label><input name="name" required /></div><div className="field"><label>Kategori</label><input name="category" required /></div><div className="field full"><label>Deskripsi</label><textarea name="description" required minLength={15} rows={5} /></div><div className="field full"><label>Lokasi umum</label><input name="generalLocation" required /></div><div className="field"><label>Latitude</label><input name="latitude" type="number" step="any" /></div><div className="field"><label>Longitude</label><input name="longitude" type="number" step="any" /></div><div className="field full"><label>Tautan Google Maps</label><input name="mapsUrl" type="url" /></div>
      </>}
      {type !== "map" ? <div className="field full"><label>Foto publik (JPG/PNG/WEBP, maks. 4 MB)</label><input type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} />{image ? <img className="submission-preview" src={image} alt="Pratinjau" /> : null}</div> : null}
    </div>
    {message ? <p className={message.includes("berhasil") ? "success-text" : "error-text"}>{message}</p> : null}
    <button className="button button-primary" type="submit" disabled={loading}>{loading ? "Mengirim..." : "Kirim untuk diverifikasi"}</button>
  </form>;
}
