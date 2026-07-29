import Link from "next/link";
import { ArrowRight, FilePlus2, MapPinned, Newspaper, Store } from "lucide-react";
import { CONTRIBUTION_TYPE_LABELS, REQUEST_STATUS_LABELS, SUBMISSION_STATUS_LABELS, type CitizenRequestSummary, type CitizenSubmissionSummary } from "@/lib/portal-types";

export function CitizenDashboard({ requests, submissions }: { requests: CitizenRequestSummary[]; submissions: CitizenSubmissionSummary[] }) {
  return <div className="portal-grid">
    <section className="portal-main-column">
      <div className="portal-action-grid">
        <Link className="portal-action-card" href="/warga/pengajuan/baru"><FilePlus2 /><strong>Ajukan surat</strong><span>Surat Keterangan Usaha</span></Link>
        <Link className="portal-action-card" href="/warga/kontribusi/baru?type=umkm"><Store /><strong>Ajukan UMKM</strong><span>Masuk direktori setelah verifikasi</span></Link>
        <Link className="portal-action-card" href="/warga/kontribusi/baru?type=tourism"><Newspaper /><strong>Ajukan Kabar</strong><span>Kegiatan, pengumuman, wisata, atau budaya</span></Link>
        <Link className="portal-action-card" href="/warga/kontribusi/baru?type=map"><MapPinned /><strong>Ajukan lokasi</strong><span>Tambahkan lokasi ke peta publik</span></Link>
      </div>
      <section className="portal-panel">
        <div className="portal-panel-heading"><div><h2>Pengajuan surat</h2><p>Pantau status dan balasan petugas.</p></div><Link href="/warga/pengajuan/baru" className="text-link">Pengajuan baru <ArrowRight size={16} /></Link></div>
        {requests.length ? <div className="portal-list">{requests.map((item) => <Link className="portal-list-item" key={item.id} href={`/warga/pengajuan/${item.id}`}><div><strong>{item.requestNumber}</strong><span>{item.serviceName}</span></div><div><span className={`workflow-badge ${item.status}`}>{REQUEST_STATUS_LABELS[item.status]}</span><small>{new Date(item.updatedAt).toLocaleString("id-ID")}</small></div></Link>)}</div> : <div className="empty-state small-empty">Belum ada pengajuan surat.</div>}
      </section>
      <section className="portal-panel">
        <div className="portal-panel-heading"><div><h2>Kontribusi warga</h2><p>UMKM, Kabar kegiatan, dan lokasi peta.</p></div></div>
        {submissions.length ? <div className="portal-list">{submissions.map((item) => <div className="portal-list-item" key={item.id}><div><strong>{item.title}</strong><span>{item.submissionNumber} · {CONTRIBUTION_TYPE_LABELS[item.type]}</span>{item.reviewNote ? <small>Catatan: {item.reviewNote}</small> : null}</div><div><span className={`workflow-badge ${item.status}`}>{SUBMISSION_STATUS_LABELS[item.status]}</span><small>{new Date(item.updatedAt).toLocaleString("id-ID")}</small></div></div>)}</div> : <div className="empty-state small-empty">Belum ada kontribusi yang diajukan.</div>}
      </section>
    </section>
    <aside className="portal-sidebar"><div className="notice warning"><div><strong>Informasi verifikasi dokumen</strong><p>Dokumen KTP/KK tidak diunggah melalui website. Petugas akan meminta verifikasi dokumen melalui pesan atau saat warga datang ke kelurahan.</p></div></div><div className="notice"><div><strong>Privasi</strong><p>NIK dan nomor KK yang diisikan pada formulir surat disimpan dalam bentuk terenkripsi.</p></div></div></aside>
  </div>;
}
