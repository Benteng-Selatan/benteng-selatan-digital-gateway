"use client";

import { LoaderCircle, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import type { PublicAdminSession } from "@/lib/auth";
import { AdminToolbar } from "@/components/admin/AdminToolbar";

type AuditLog = {
  id: string;
  actorUsername: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  ipAddress: string;
  createdAt: string;
};

export function AuditLogViewer({ user }: { user: PublicAdminSession }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/audit?limit=250");
    const payload = await response.json() as { logs?: AuditLog[]; message?: string };
    setLoading(false);
    if (!response.ok || !payload.logs) {
      setMessage(payload.message || "Audit log gagal dimuat.");
      return;
    }
    setLogs(payload.logs);
    setMessage("");
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [load]);

  return <div className="admin-shell">
    <AdminToolbar title="Audit Aktivitas" subtitle="Jejak tindakan petugas" user={user} />
    <main className="container operations-page">
      <div className="admin-page-heading"><h1>Audit Log</h1><p>Menampilkan 250 aktivitas terbaru. Log tidak dapat diubah dari dashboard.</p></div>
      {message ? <div className="notice compact"><div><strong>Status</strong><p>{message}</p></div></div> : null}
      <section className="admin-panel">
        <div className="admin-panel-header"><div><h2>Aktivitas terbaru</h2><p>{logs.length} catatan.</p></div><button className="icon-button" onClick={() => void load()} aria-label="Muat ulang"><RefreshCw size={18} /></button></div>
        {loading ? <div className="empty-state"><LoaderCircle className="loading-spin" /> Memuat...</div> : null}
        <div className="submission-review-list">
          {logs.map((log) => <details className="admin-item" key={log.id}>
            <summary className="admin-item-summary"><div><span className="workflow-badge under_review">{log.action}</span><h3>{log.actorName}</h3><p>{new Date(log.createdAt).toLocaleString("id-ID")} · {log.entityType} {log.entityId ? `#${log.entityId}` : ""}</p></div></summary>
            <div className="admin-form-box"><dl className="detail-grid"><div><dt>Username</dt><dd>{log.actorUsername}</dd></div><div><dt>Role</dt><dd>{log.actorRole}</dd></div><div><dt>IP</dt><dd>{log.ipAddress}</dd></div><div className="full"><dt>Metadata</dt><dd><pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(log.metadata, null, 2)}</pre></dd></div></dl></div>
          </details>)}
        </div>
      </section>
    </main>
  </div>;
}
