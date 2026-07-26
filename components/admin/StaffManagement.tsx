"use client";

import { LoaderCircle, RefreshCw, UserPlus } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";

import { ADMIN_ROLES, ADMIN_ROLE_LABELS, type AdminRole } from "@/lib/admin-permissions";
import type { PublicAdminSession } from "@/lib/auth";
import { AdminToolbar } from "@/components/admin/AdminToolbar";

type Staff = {
  id: string;
  username: string;
  fullName: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export function StaffManagement({ user }: { user: PublicAdminSession }) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/staff");
    const payload = await response.json() as { staff?: Staff[]; message?: string };
    setLoading(false);
    if (!response.ok || !payload.staff) {
      setMessage(payload.message || "Data petugas gagal dimuat.");
      return;
    }
    setStaff(payload.staff);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [load]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setMessage("Membuat akun...");
    const response = await fetch("/api/admin/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const payload = await response.json() as { message?: string };
    if (!response.ok) return setMessage(payload.message || "Akun gagal dibuat.");
    form.reset();
    setMessage("Akun petugas berhasil dibuat.");
    await load();
  }

  async function update(item: Staff, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = {
      fullName: String(formData.get("fullName") || ""),
      role: String(formData.get("role") || item.role),
      isActive: formData.get("isActive") === "true",
      password: String(formData.get("password") || ""),
    };
    setMessage("Memperbarui akun...");
    const response = await fetch(`/api/admin/staff/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const payload = await response.json() as { message?: string };
    if (!response.ok) return setMessage(payload.message || "Akun gagal diperbarui.");
    setMessage("Akun petugas berhasil diperbarui. Perubahan keamanan akan mengakhiri sesi lama akun tersebut.");
    await load();
  }

  return <div className="admin-shell">
    <AdminToolbar title="Manajemen Petugas" subtitle="Akun, role, dan akses" user={user} />
    <main className="container operations-page">
      <div className="admin-page-heading"><h1>Akun Petugas</h1><p>Setiap petugas menggunakan akun sendiri agar aktivitas dapat ditelusuri.</p></div>
      {message ? <div className="notice compact"><div><strong>Status</strong><p>{message}</p></div></div> : null}
      <section className="admin-panel">
        <div className="admin-panel-header"><div><h2>Tambah petugas</h2><p>Kata sandi minimal 12 karakter.</p></div><UserPlus /></div>
        <form className="portal-form" onSubmit={create}>
          <div className="portal-form-grid">
            <div className="field"><label>Nama lengkap</label><input name="fullName" required minLength={3} /></div>
            <div className="field"><label>Nama pengguna</label><input name="username" required minLength={3} autoComplete="off" /></div>
            <div className="field"><label>Role</label><select name="role" defaultValue="operator">{ADMIN_ROLES.map((role) => <option key={role} value={role}>{ADMIN_ROLE_LABELS[role]}</option>)}</select></div>
            <div className="field"><label>Kata sandi awal</label><input name="password" type="password" required minLength={12} autoComplete="new-password" /></div>
          </div>
          <button className="button button-primary" type="submit"><UserPlus size={16} /> Buat akun</button>
        </form>
      </section>
      <section className="admin-panel" style={{ marginTop: 20 }}>
        <div className="admin-panel-header"><div><h2>Daftar petugas</h2><p>{staff.length} akun terdaftar.</p></div><button className="icon-button" onClick={() => void load()} aria-label="Muat ulang"><RefreshCw size={18} /></button></div>
        {loading ? <div className="empty-state"><LoaderCircle className="loading-spin" /> Memuat...</div> : null}
        <div className="submission-review-list">
          {staff.map((item) => <details className="admin-item" key={item.id}>
            <summary className="admin-item-summary"><div><span className={`workflow-badge ${item.isActive ? "approved" : "rejected"}`}>{item.isActive ? "Aktif" : "Nonaktif"}</span><h3>{item.fullName}</h3><p>@{item.username} · {ADMIN_ROLE_LABELS[item.role]}</p></div></summary>
            <form className="admin-form-box" onSubmit={(event) => void update(item, event)}>
              <div className="portal-form-grid">
                <div className="field"><label>Nama lengkap</label><input name="fullName" defaultValue={item.fullName} required /></div>
                <div className="field"><label>Role</label><select name="role" defaultValue={item.role}>{ADMIN_ROLES.map((role) => <option key={role} value={role}>{ADMIN_ROLE_LABELS[role]}</option>)}</select></div>
                <div className="field"><label>Status akun</label><select name="isActive" defaultValue={String(item.isActive)}><option value="true">Aktif</option><option value="false">Nonaktif</option></select></div>
                <div className="field"><label>Kata sandi baru (opsional)</label><input name="password" type="password" minLength={12} autoComplete="new-password" /></div>
              </div>
              <p><small>Login terakhir: {item.lastLoginAt ? new Date(item.lastLoginAt).toLocaleString("id-ID") : "Belum pernah"}</small></p>
              <button className="button button-primary" type="submit">Simpan perubahan</button>
            </form>
          </details>)}
        </div>
      </section>
    </main>
  </div>;
}
