"use client";

import { FormEvent, useState } from "react";
import { REQUEST_STATUS_LABELS, type ServiceRequestStatus } from "@/lib/portal-types";

type Detail = {
  id: string; requestNumber: string; status: ServiceRequestStatus; applicantName: string; identityNumber: string; familyCardNumber: string; phone: string; address: string; formData: Record<string,string>; citizenNote: string; staffNote: string; submittedAt: string; updatedAt: string;
  messages: { id: string; senderType: string; senderLabel: string; message: string; createdAt: string }[];
  history: { id: string; newStatus: string; changedBy: string; note: string; createdAt: string }[];
};

export function RequestDetail({ initialRequest }: { initialRequest: Detail }) {
  const [request, setRequest] = useState(initialRequest);
  const [message, setMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  async function refresh() { const response = await fetch(`/api/citizen/requests/${request.id}`); const result = await response.json(); if (response.ok) setRequest(result.request); }
  async function send(event: FormEvent) { event.preventDefault(); setStatusMessage(""); const response = await fetch(`/api/citizen/requests/${request.id}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message }) }); const result = await response.json(); if (!response.ok) { setStatusMessage(result.message || "Pesan gagal dikirim."); return; } setMessage(""); setStatusMessage("Pesan terkirim."); await refresh(); }
  return <div className="portal-grid">
    <section className="portal-main-column">
      <section className="portal-panel"><div className="portal-panel-heading"><div><span className={`workflow-badge ${request.status}`}>{REQUEST_STATUS_LABELS[request.status]}</span><h2>{request.requestNumber}</h2><p>Surat Keterangan Usaha</p></div></div>
        <dl className="detail-grid"><div><dt>Nama pemohon</dt><dd>{request.applicantName}</dd></div><div><dt>NIK</dt><dd>{request.identityNumber}</dd></div><div><dt>Nomor KK</dt><dd>{request.familyCardNumber || "Tidak diisi"}</dd></div><div><dt>WhatsApp</dt><dd>{request.phone}</dd></div><div className="full"><dt>Alamat</dt><dd>{request.address}</dd></div><div><dt>Nama usaha</dt><dd>{request.formData.businessName}</dd></div><div><dt>Jenis usaha</dt><dd>{request.formData.businessType}</dd></div><div className="full"><dt>Alamat usaha</dt><dd>{request.formData.businessAddress}</dd></div><div className="full"><dt>Keperluan</dt><dd>{request.formData.purpose}</dd></div></dl>
        {request.staffNote ? <div className="notice warning"><div><strong>Catatan petugas</strong><p>{request.staffNote}</p></div></div> : null}
      </section>
      <section className="portal-panel"><div className="portal-panel-heading"><div><h2>Pesan dengan petugas</h2><p>Gunakan halaman ini untuk menanggapi permintaan perbaikan.</p></div></div>
        <div className="message-thread">{request.messages.length ? request.messages.map((item) => <article key={item.id} className={`message-bubble ${item.senderType}`}><strong>{item.senderLabel}</strong><p>{item.message}</p><small>{new Date(item.createdAt).toLocaleString("id-ID")}</small></article>) : <div className="empty-state small-empty">Belum ada pesan.</div>}</div>
        <form className="message-form" onSubmit={send}><textarea value={message} onChange={(e) => setMessage(e.target.value)} required minLength={2} maxLength={1500} rows={3} placeholder="Tulis pesan..." /><button className="button button-primary" type="submit">Kirim pesan</button></form>{statusMessage ? <small>{statusMessage}</small> : null}
      </section>
    </section>
    <aside className="portal-sidebar"><section className="portal-panel"><h3>Riwayat status</h3><div className="timeline">{request.history.map((item) => <div key={item.id}><span></span><div><strong>{REQUEST_STATUS_LABELS[item.newStatus as ServiceRequestStatus] || item.newStatus}</strong><p>{item.note}</p><small>{new Date(item.createdAt).toLocaleString("id-ID")} · {item.changedBy}</small></div></div>)}</div></section></aside>
  </div>;
}
