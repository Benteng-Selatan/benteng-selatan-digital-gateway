"use client";

import { LoaderCircle } from "lucide-react";
import { FormEvent, useState } from "react";
import type { PublicCitizen } from "@/lib/portal-types";

export function NewServiceRequestForm({ citizen }: { citizen: PublicCitizen }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage("");
    try {
      const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
      const response = await fetch("/api/citizen/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json() as { message?: string; result?: { id: string } };
      if (!response.ok || !result.result) throw new Error(result.message || "Pengajuan gagal.");
      window.location.href = `/warga/pengajuan/${result.result.id}`;
    } catch (error) { setMessage(error instanceof Error ? error.message : "Pengajuan gagal."); }
    finally { setLoading(false); }
  }
  return <form className="portal-form portal-form-wide" onSubmit={submit}>
    <div className="form-section-title"><h2>Data pemohon</h2><p>Isi sesuai dokumen kependudukan.</p></div>
    <div className="portal-form-grid">
      <div className="field"><label>Nama lengkap</label><input name="applicantName" defaultValue={citizen.fullName} required /></div>
      <div className="field"><label>NIK (16 digit)</label><input name="identityNumber" required inputMode="numeric" pattern="[0-9]{16}" maxLength={16} /></div>
      <div className="field"><label>Nomor KK (opsional, 16 digit)</label><input name="familyCardNumber" inputMode="numeric" pattern="[0-9]{16}" maxLength={16} /></div>
      <div className="field"><label>Nomor WhatsApp</label><input name="phone" defaultValue={citizen.phone} required /></div>
      <div className="field full"><label>Alamat lengkap</label><textarea name="address" defaultValue={citizen.address} required rows={3} /></div>
    </div>
    <div className="form-section-title"><h2>Data usaha</h2><p>Data ini akan diverifikasi sebelum surat diterbitkan.</p></div>
    <div className="portal-form-grid">
      <div className="field"><label>Nama usaha</label><input name="businessName" required /></div>
      <div className="field"><label>Jenis usaha</label><input name="businessType" required placeholder="Kuliner, perdagangan, jasa, dll." /></div>
      <div className="field full"><label>Alamat/lokasi usaha</label><textarea name="businessAddress" required rows={3} /></div>
      <div className="field full"><label>Keperluan surat</label><textarea name="purpose" required rows={3} placeholder="Contoh: persyaratan administrasi usaha" /></div>
      <div className="field full"><label>Catatan tambahan (opsional)</label><textarea name="citizenNote" rows={3} /></div>
    </div>
    <div className="notice warning"><div><strong>Verifikasi dokumen</strong><p>Jangan mengunggah KTP atau KK ke media publik. Petugas akan memberi instruksi verifikasi melalui halaman detail pengajuan.</p></div></div>
    {message ? <p className="error-text">{message}</p> : null}
    <button className="button button-primary" type="submit" disabled={loading}>{loading ? <><LoaderCircle className="loading-spin" size={17} /> Mengirim...</> : "Kirim pengajuan"}</button>
  </form>;
}
