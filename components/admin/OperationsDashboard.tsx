"use client";

import { FileCheck2, LoaderCircle, MessageSquareText, RefreshCw, Send, Store } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { AdminToolbar } from "@/components/admin/AdminToolbar";
import type { AdminPermission } from "@/lib/admin-permissions";
import type { PublicAdminSession } from "@/lib/auth";
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
  id: string;
  requestNumber: string;
  status: ServiceRequestStatus;
  applicantName: string;
  citizenEmail: string;
  updatedAt: string;
  submittedAt: string;
};

type RequestDetail = StaffRequest & {
  identityNumber: string;
  familyCardNumber: string;
  sensitiveDataMasked: boolean;
  phone: string;
  address: string;
  formData: Record<string, string>;
  citizenNote: string;
  assignedTo: string;
  staffNote: string;
  messages: { id: string; senderType: string; senderLabel: string; message: string; isInternal: boolean; createdAt: string }[];
  history: { id: string; previousStatus: string; newStatus: string; changedBy: string; note: string; createdAt: string }[];
};

type Submission = {
  id: string;
  submissionNumber: string;
  type: ContributionType;
  status: SubmissionStatus;
  title: string;
  citizenName: string;
  citizenEmail: string;
  payload: Record<string, unknown>;
  reviewNote: string;
  updatedAt: string;
};

export function OperationsDashboard({ user }: { user: PublicAdminSession }) {
  const can = (permission: AdminPermission) => user.permissions.includes(permission);
  const canViewRequests = can("requests:view");
  const canEditRequests = can("requests:edit");
  const canMessage = can("requests:message");
  const canViewSubmissions = can("submissions:view");
  const canReviewSubmissions = can("submissions:review");
  const defaultTab = canViewRequests ? "requests" : "submissions";

  const [tab, setTab] = useState<"requests" | "submissions">(defaultTab);
  const [requests, setRequests] = useState<StaffRequest[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selected, setSelected] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadLists = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const jobs: Promise<void>[] = [];
      if (canViewRequests) {
        jobs.push(fetch("/api/admin/requests").then(async (response) => {
          const payload = await response.json();
          if (!response.ok) throw new Error(payload.message || "Gagal memuat pengajuan.");
          setRequests(payload.requests);
        }));
      }
      if (canViewSubmissions) {
        jobs.push(fetch("/api/admin/submissions").then(async (response) => {
          const payload = await response.json();
          if (!response.ok) throw new Error(payload.message || "Gagal memuat kontribusi.");
          setSubmissions(payload.submissions);
        }));
      }
      await Promise.all(jobs);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Data gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, [canViewRequests, canViewSubmissions]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadLists();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadLists]);

  async function openRequest(id: string) {
    setMessage("Memuat detail...");
    const response = await fetch(`/api/admin/requests/${id}`);
    const payload = await response.json();
    if (!response.ok) return setMessage(payload.message || "Detail gagal dimuat.");
    setSelected(payload.request);
    setMessage("");
  }

  async function saveRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !canEditRequests) return;
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    setMessage("Menyimpan...");
    const response = await fetch(`/api/admin/requests/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const payload = await response.json();
    if (!response.ok) return setMessage(payload.message || "Pembaruan gagal.");
    await openRequest(selected.id);
    await loadLists();
    setMessage("Pengajuan berhasil diperbarui.");
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !canMessage) return;
    const form = event.currentTarget;
    const formData = new FormData(form);
    const data = { message: String(formData.get("message") || ""), isInternal: formData.get("isInternal") === "true" };
    setMessage("Mengirim pesan...");
    const response = await fetch(`/api/admin/requests/${selected.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const payload = await response.json();
    if (!response.ok) return setMessage(payload.message || "Pesan gagal dikirim.");
    form.reset();
    await openRequest(selected.id);
    setMessage("Pesan berhasil dikirim.");
  }

  async function updateSubmission(item: Submission, status: SubmissionStatus, reviewNote: string) {
    if (!canReviewSubmissions) return;
    const action = status === "published" ? "terbitkan" : item.status === "published" ? "tarik dari publik" : "perbarui";
    if ((status === "published" || item.status === "published") && !window.confirm(`Yakin ingin ${action} kontribusi ini?`)) return;
    setMessage("Memperbarui kontribusi...");
    const response = await fetch(`/api/admin/submissions/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reviewNote }),
    });
    const payload = await response.json();
    if (!response.ok) return setMessage(payload.message || "Pembaruan gagal.");
    await loadLists();
    setMessage(status === "published" ? "Kontribusi diterbitkan ke website." : item.status === "published" ? "Kontribusi ditarik dari website publik." : "Kontribusi diperbarui.");
  }

  const filteredRequests = useMemo(
    () => statusFilter === "all" ? requests : requests.filter((item) => item.status === statusFilter),
    [requests, statusFilter]
  );
  const counts = useMemo(() => ({
    newRequests: requests.filter((item) => item.status === "submitted").length,
    revision: requests.filter((item) => item.status === "revision_required").length,
    submissions: submissions.filter((item) => item.status === "submitted").length,
    total: requests.length + submissions.length,
  }), [requests, submissions]);

  return <div className="admin-shell">
    <AdminToolbar title="Operasional Layanan" subtitle="Pengajuan dan moderasi" user={user} />
    <main className="container operations-page">
      <div className="admin-page-heading"><h1>Layanan Warga</h1><p>Akses menu mengikuti role akun petugas yang sedang login.</p></div>
      <div className="stats-grid"><article><FileCheck2 size={25} /><strong>{counts.newRequests}</strong><span>Pengajuan baru</span></article><article><MessageSquareText size={25} /><strong>{counts.revision}</strong><span>Perlu perbaikan</span></article><article><Store size={25} /><strong>{counts.submissions}</strong><span>Kontribusi baru</span></article><article><FileCheck2 size={25} /><strong>{counts.total}</strong><span>Total transaksi</span></article></div>
      <div className="operations-tabs">
        {canViewRequests ? <button className={tab === "requests" ? "active" : ""} onClick={() => setTab("requests")}>Pengajuan surat</button> : null}
        {canViewSubmissions ? <button className={tab === "submissions" ? "active" : ""} onClick={() => setTab("submissions")}>Kontribusi warga</button> : null}
      </div>
      {message ? <div className="notice compact"><div><strong>Status</strong><p>{message}</p></div></div> : null}
      {loading ? <div className="empty-state"><LoaderCircle className="loading-spin" /> Memuat data...</div> : null}

      {!loading && tab === "requests" && canViewRequests ? <div className="operations-layout">
        <section className="admin-panel"><div className="admin-panel-header"><div><h2>Antrean surat</h2><p>Klik pengajuan untuk membuka detail.</p></div><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">Semua status</option>{REQUEST_STATUSES.map((status) => <option key={status} value={status}>{REQUEST_STATUS_LABELS[status]}</option>)}</select></div><div className="portal-list">{filteredRequests.map((item) => <button className={`portal-list-item operation-list-button ${selected?.id === item.id ? "selected" : ""}`} key={item.id} onClick={() => void openRequest(item.id)}><div><strong>{item.requestNumber}</strong><span>{item.applicantName} · {item.citizenEmail}</span></div><div><span className={`workflow-badge ${item.status}`}>{REQUEST_STATUS_LABELS[item.status]}</span><small>{new Date(item.updatedAt).toLocaleString("id-ID")}</small></div></button>)}</div></section>
        <section className="admin-panel operation-detail">{selected ? <>
          <div className="admin-panel-header"><div><span className={`workflow-badge ${selected.status}`}>{REQUEST_STATUS_LABELS[selected.status]}</span><h2>{selected.requestNumber}</h2><p>{selected.applicantName} · {selected.citizenEmail}</p></div></div>
          {selected.sensitiveDataMasked ? <div className="notice compact"><div><strong>Data sensitif dimasking</strong><p>Role Anda tidak memiliki izin melihat NIK/KK lengkap.</p></div></div> : null}
          <dl className="detail-grid"><div><dt>NIK</dt><dd>{selected.identityNumber}</dd></div><div><dt>Nomor KK</dt><dd>{selected.familyCardNumber || "Tidak diisi"}</dd></div><div><dt>WhatsApp</dt><dd>{selected.phone}</dd></div><div className="full"><dt>Alamat</dt><dd>{selected.address}</dd></div><div><dt>Nama usaha</dt><dd>{selected.formData.businessName}</dd></div><div><dt>Jenis usaha</dt><dd>{selected.formData.businessType}</dd></div><div className="full"><dt>Alamat usaha</dt><dd>{selected.formData.businessAddress}</dd></div><div className="full"><dt>Keperluan</dt><dd>{selected.formData.purpose}</dd></div></dl>
          {canEditRequests ? <form className="portal-form" onSubmit={saveRequest}><div className="portal-form-grid"><div className="field"><label>Status</label><select name="status" defaultValue={selected.status}>{REQUEST_STATUSES.map((status) => <option key={status} value={status}>{REQUEST_STATUS_LABELS[status]}</option>)}</select></div><div className="field"><label>Petugas penanggung jawab</label><input name="assignedTo" defaultValue={selected.assignedTo} /></div><div className="field full"><label>Catatan petugas untuk warga</label><textarea name="staffNote" defaultValue={selected.staffNote} rows={3} /></div></div><button className="button button-primary" type="submit">Simpan status</button></form> : null}
          <div className="message-thread staff-thread">{selected.messages.map((item) => <article key={item.id} className={`message-bubble ${item.senderType} ${item.isInternal ? "internal" : ""}`}><strong>{item.senderLabel}{item.isInternal ? " · Catatan internal" : ""}</strong><p>{item.message}</p><small>{new Date(item.createdAt).toLocaleString("id-ID")}</small></article>)}</div>
          {canMessage ? <form className="message-form" onSubmit={sendMessage}><textarea name="message" required minLength={2} rows={3} placeholder="Tulis pesan atau catatan internal..." /><label className="checkbox-field"><input type="checkbox" name="isInternal" value="true" /> Hanya terlihat petugas</label><button className="button button-primary" type="submit"><Send size={16} /> Kirim</button></form> : null}
        </> : <div className="empty-state">Pilih salah satu pengajuan untuk melihat detail.</div>}</section>
      </div> : null}

      {!loading && tab === "submissions" && canViewSubmissions ? <section className="admin-panel"><div className="admin-panel-header"><div><h2>Moderasi kontribusi</h2><p>Perubahan dari “Diterbitkan” ke status lain otomatis menarik konten dari website publik.</p></div><button className="icon-button" onClick={() => void loadLists()} aria-label="Muat ulang"><RefreshCw size={18} /></button></div><div className="submission-review-list">{submissions.map((item) => <SubmissionReview key={`${item.id}:${item.status}:${item.reviewNote}`} item={item} canEdit={canReviewSubmissions} onSave={updateSubmission} />)}</div></section> : null}
    </main>
  </div>;
}

function SubmissionReview({ item, canEdit, onSave }: { item: Submission; canEdit: boolean; onSave: (item: Submission, status: SubmissionStatus, note: string) => Promise<void> }) {
  const [status, setStatus] = useState<SubmissionStatus>(item.status);
  const [note, setNote] = useState(item.reviewNote);
  return <details className="admin-item"><summary className="admin-item-summary"><div><span className={`workflow-badge ${item.status}`}>{SUBMISSION_STATUS_LABELS[item.status]}</span><h3>{item.title}</h3><p>{item.submissionNumber} · {CONTRIBUTION_TYPE_LABELS[item.type]} · {item.citizenName}</p></div></summary><div className="admin-form-box"><dl className="detail-grid">{Object.entries(item.payload).map(([key, value]) => <div key={key} className={String(value).length > 80 ? "full" : ""}><dt>{key}</dt><dd>{typeof value === "boolean" ? value ? "Ya" : "Tidak" : String(value ?? "-")}</dd></div>)}</dl><div className="portal-form-grid"><div className="field"><label>Status</label><select value={status} disabled={!canEdit} onChange={(e) => setStatus(e.target.value as SubmissionStatus)}>{SUBMISSION_STATUSES.map((value) => <option key={value} value={value}>{SUBMISSION_STATUS_LABELS[value]}</option>)}</select></div><div className="field full"><label>Catatan untuk warga</label><textarea value={note} disabled={!canEdit} onChange={(e) => setNote(e.target.value)} rows={3} /></div></div>{canEdit ? <button className="button button-primary" type="button" onClick={() => void onSave(item, status, note)}>Simpan moderasi</button> : <p><small>Mode baca saja.</small></p>}</div></details>;
}
