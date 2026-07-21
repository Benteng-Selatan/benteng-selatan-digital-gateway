"use client";

import Link from "next/link";
import { ArrowLeft, FileCheck2, LoaderCircle, MessageSquareText, RefreshCw, Send, Store } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CONTRIBUTION_TYPE_LABELS,
  REQUEST_STATUSES,
  REQUEST_STATUS_LABELS,
  SUBMISSION_STATUSES,
  SUBMISSION_STATUS_LABELS,
  type ContributionType,
  type ServiceRequestStatus,
  type SubmissionStatus,
} from "@/lib/portal-types";

type StaffRequest = {
  id: string; requestNumber: string; status: ServiceRequestStatus; applicantName: string; citizenEmail: string; identityNumber: string; familyCardNumber: string; phone: string; address: string; formData: Record<string,string>; citizenNote: string; assignedTo: string; staffNote: string; updatedAt: string; submittedAt: string;
};
type RequestDetail = StaffRequest & {
  messages: { id: string; senderType: string; senderLabel: string; message: string; isInternal: boolean; createdAt: string }[];
  history: { id: string; previousStatus: string; newStatus: string; changedBy: string; note: string; createdAt: string }[];
};
type Submission = { id: string; submissionNumber: string; type: ContributionType; status: SubmissionStatus; title: string; citizenName: string; citizenEmail: string; payload: Record<string, unknown>; reviewNote: string; updatedAt: string };

export function OperationsDashboard() {
  const [tab, setTab] = useState<"requests" | "submissions">("requests");
  const [requests, setRequests] = useState<StaffRequest[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selected, setSelected] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  async function loadLists() {
    setLoading(true); setMessage("");
    try {
      const [requestResponse, submissionResponse] = await Promise.all([fetch("/api/admin/requests"), fetch("/api/admin/submissions")]);
      const requestPayload = await requestResponse.json(); const submissionPayload = await submissionResponse.json();
      if (!requestResponse.ok) throw new Error(requestPayload.message || "Gagal memuat pengajuan.");
      if (!submissionResponse.ok) throw new Error(submissionPayload.message || "Gagal memuat kontribusi.");
      setRequests(requestPayload.requests); setSubmissions(submissionPayload.submissions);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Data gagal dimuat."); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    let active = true;
    Promise.all([fetch("/api/admin/requests"), fetch("/api/admin/submissions")])
      .then(async ([requestResponse, submissionResponse]) => {
        const requestPayload = await requestResponse.json();
        const submissionPayload = await submissionResponse.json();
        if (!requestResponse.ok) throw new Error(requestPayload.message || "Gagal memuat pengajuan.");
        if (!submissionResponse.ok) throw new Error(submissionPayload.message || "Gagal memuat kontribusi.");
        if (active) {
          setRequests(requestPayload.requests);
          setSubmissions(submissionPayload.submissions);
        }
      })
      .catch((error: unknown) => { if (active) setMessage(error instanceof Error ? error.message : "Data gagal dimuat."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function openRequest(id: string) {
    setMessage("Memuat detail...");
    const response = await fetch(`/api/admin/requests/${id}`); const payload = await response.json();
    if (!response.ok) { setMessage(payload.message || "Detail gagal dimuat."); return; }
    setSelected(payload.request); setMessage("");
  }

  async function saveRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected) return;
    const data = Object.fromEntries(new FormData(event.currentTarget).entries()); setMessage("Menyimpan...");
    const response = await fetch(`/api/admin/requests/${selected.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const payload = await response.json(); if (!response.ok) { setMessage(payload.message || "Pembaruan gagal."); return; }
    await openRequest(selected.id); await loadLists(); setMessage("Pengajuan berhasil diperbarui.");
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected) return; const form = event.currentTarget; const formData = new FormData(form);
    const data = { message: String(formData.get("message") || ""), isInternal: formData.get("isInternal") === "true" }; setMessage("Mengirim pesan...");
    const response = await fetch(`/api/admin/requests/${selected.id}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const payload = await response.json(); if (!response.ok) { setMessage(payload.message || "Pesan gagal dikirim."); return; }
    form.reset(); await openRequest(selected.id); setMessage("Pesan berhasil dikirim.");
  }

  async function updateSubmission(item: Submission, status: SubmissionStatus, reviewNote: string) {
    if (status === "published" && !window.confirm("Terbitkan data ini ke website publik?")) return;
    setMessage("Memperbarui kontribusi...");
    const response = await fetch(`/api/admin/submissions/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, reviewNote }) });
    const payload = await response.json(); if (!response.ok) { setMessage(payload.message || "Pembaruan gagal."); return; }
    await loadLists(); setMessage(status === "published" ? "Kontribusi diterbitkan ke website." : "Kontribusi diperbarui.");
  }

  const filteredRequests = useMemo(() => statusFilter === "all" ? requests : requests.filter((item) => item.status === statusFilter), [requests, statusFilter]);
  const counts = useMemo(() => ({ newRequests: requests.filter((item) => item.status === "submitted").length, revision: requests.filter((item) => item.status === "revision_required").length, submissions: submissions.filter((item) => item.status === "submitted").length }), [requests, submissions]);

  return <div className="admin-shell">
    <header className="admin-topbar"><div className="container admin-topbar-inner"><div className="brand"><span className="brand-mark">BS</span><span><strong>Operasional Layanan</strong><small>Pengajuan warga & moderasi konten</small></span></div><div className="admin-topbar-actions"><Link href="/admin" className="button button-outline"><ArrowLeft size={17} /> CMS Konten</Link><button className="icon-button" onClick={() => void loadLists()} aria-label="Muat ulang"><RefreshCw size={18} /></button></div></div></header>
    <main className="container operations-page">
      <div className="admin-page-heading"><h1>Layanan Warga</h1><p>Kelola permohonan surat dan kontribusi publik tanpa mengubah struktur CMS utama.</p></div>
      <div className="stats-grid"><article><FileCheck2 size={25} /><strong>{counts.newRequests}</strong><span>Pengajuan baru</span></article><article><MessageSquareText size={25} /><strong>{counts.revision}</strong><span>Perlu perbaikan</span></article><article><Store size={25} /><strong>{counts.submissions}</strong><span>Kontribusi baru</span></article><article><FileCheck2 size={25} /><strong>{requests.length + submissions.length}</strong><span>Total transaksi</span></article></div>
      <div className="operations-tabs"><button className={tab === "requests" ? "active" : ""} onClick={() => setTab("requests")}>Pengajuan surat</button><button className={tab === "submissions" ? "active" : ""} onClick={() => setTab("submissions")}>Kontribusi warga</button></div>
      {message ? <div className="notice compact"><div><strong>Status</strong><p>{message}</p></div></div> : null}
      {loading ? <div className="empty-state"><LoaderCircle className="loading-spin" /> Memuat data...</div> : null}
      {!loading && tab === "requests" ? <div className="operations-layout">
        <section className="admin-panel"><div className="admin-panel-header"><div><h2>Antrean surat</h2><p>Klik pengajuan untuk membuka detail.</p></div><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">Semua status</option>{REQUEST_STATUSES.map((status) => <option key={status} value={status}>{REQUEST_STATUS_LABELS[status]}</option>)}</select></div><div className="portal-list">{filteredRequests.map((item) => <button className={`portal-list-item operation-list-button ${selected?.id === item.id ? "selected" : ""}`} key={item.id} onClick={() => void openRequest(item.id)}><div><strong>{item.requestNumber}</strong><span>{item.applicantName} · {item.citizenEmail}</span></div><div><span className={`workflow-badge ${item.status}`}>{REQUEST_STATUS_LABELS[item.status]}</span><small>{new Date(item.updatedAt).toLocaleString("id-ID")}</small></div></button>)}</div></section>
        <section className="admin-panel operation-detail">{selected ? <>
          <div className="admin-panel-header"><div><span className={`workflow-badge ${selected.status}`}>{REQUEST_STATUS_LABELS[selected.status]}</span><h2>{selected.requestNumber}</h2><p>{selected.applicantName} · {selected.citizenEmail}</p></div></div>
          <dl className="detail-grid"><div><dt>NIK</dt><dd>{selected.identityNumber}</dd></div><div><dt>Nomor KK</dt><dd>{selected.familyCardNumber || "Tidak diisi"}</dd></div><div><dt>WhatsApp</dt><dd>{selected.phone}</dd></div><div className="full"><dt>Alamat</dt><dd>{selected.address}</dd></div><div><dt>Nama usaha</dt><dd>{selected.formData.businessName}</dd></div><div><dt>Jenis usaha</dt><dd>{selected.formData.businessType}</dd></div><div className="full"><dt>Alamat usaha</dt><dd>{selected.formData.businessAddress}</dd></div><div className="full"><dt>Keperluan</dt><dd>{selected.formData.purpose}</dd></div></dl>
          <form className="portal-form" onSubmit={saveRequest}><div className="portal-form-grid"><div className="field"><label>Status</label><select name="status" defaultValue={selected.status}>{REQUEST_STATUSES.map((status) => <option key={status} value={status}>{REQUEST_STATUS_LABELS[status]}</option>)}</select></div><div className="field"><label>Petugas penanggung jawab</label><input name="assignedTo" defaultValue={selected.assignedTo} /></div><div className="field full"><label>Catatan petugas untuk warga</label><textarea name="staffNote" defaultValue={selected.staffNote} rows={3} /></div></div><button className="button button-primary" type="submit">Simpan status</button></form>
          <div className="message-thread staff-thread">{selected.messages.map((item) => <article key={item.id} className={`message-bubble ${item.senderType} ${item.isInternal ? "internal" : ""}`}><strong>{item.senderLabel}{item.isInternal ? " · Catatan internal" : ""}</strong><p>{item.message}</p><small>{new Date(item.createdAt).toLocaleString("id-ID")}</small></article>)}</div>
          <form className="message-form" onSubmit={sendMessage}><textarea name="message" required minLength={2} rows={3} placeholder="Tulis pesan atau catatan internal..." /><label className="checkbox-field"><input type="checkbox" name="isInternal" value="true" /> Hanya terlihat petugas</label><button className="button button-primary" type="submit"><Send size={16} /> Kirim</button></form>
        </> : <div className="empty-state">Pilih salah satu pengajuan untuk melihat detail.</div>}</section>
      </div> : null}
      {!loading && tab === "submissions" ? <section className="admin-panel"><div className="admin-panel-header"><div><h2>Moderasi kontribusi</h2><p>Status “Diterbitkan” akan menambahkan data ke CMS publik.</p></div></div><div className="submission-review-list">{submissions.map((item) => <SubmissionReview key={item.id} item={item} onSave={updateSubmission} />)}</div></section> : null}
    </main>
  </div>;
}

function SubmissionReview({ item, onSave }: { item: Submission; onSave: (item: Submission, status: SubmissionStatus, note: string) => Promise<void> }) {
  const [status, setStatus] = useState<SubmissionStatus>(item.status);
  const [note, setNote] = useState(item.reviewNote);
  return <details className="admin-item"><summary className="admin-item-summary"><div><span className={`workflow-badge ${item.status}`}>{SUBMISSION_STATUS_LABELS[item.status]}</span><h3>{item.title}</h3><p>{item.submissionNumber} · {CONTRIBUTION_TYPE_LABELS[item.type]} · {item.citizenName}</p></div></summary><div className="admin-form-box"><dl className="detail-grid">{Object.entries(item.payload).map(([key, value]) => <div key={key} className={String(value).length > 80 ? "full" : ""}><dt>{key}</dt><dd>{typeof value === "boolean" ? value ? "Ya" : "Tidak" : String(value ?? "-")}</dd></div>)}</dl><div className="portal-form-grid"><div className="field"><label>Status</label><select value={status} onChange={(e) => setStatus(e.target.value as SubmissionStatus)}>{SUBMISSION_STATUSES.map((value) => <option key={value} value={value}>{SUBMISSION_STATUS_LABELS[value]}</option>)}</select></div><div className="field full"><label>Catatan untuk warga</label><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} /></div></div><button className="button button-primary" type="button" onClick={() => void onSave(item, status, note)}>Simpan moderasi</button></div></details>;
}
