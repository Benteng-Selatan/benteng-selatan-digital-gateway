"use client";

import Link from "next/link";
import { FileText, Globe2, History, LogOut, Settings, Users } from "lucide-react";

import type { AdminPermission } from "@/lib/admin-permissions";
import type { PublicAdminSession } from "@/lib/auth";

export function AdminToolbar({
  title,
  subtitle,
  user,
}: {
  title: string;
  subtitle: string;
  user: PublicAdminSession;
}) {
  const can = (permission: AdminPermission) => user.permissions.includes(permission);

  async function logout() {
    await fetch("/api/cms/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <header className="admin-topbar">
      <div className="container admin-topbar-inner">
        <div className="brand">
          <span className="brand-mark">BS</span>
          <span>
            <strong>{title}</strong>
            <small>{subtitle} · {user.fullName}</small>
          </span>
        </div>
        <div className="admin-topbar-actions">
          {can("cms:view") ? <Link href="/admin" className="button button-outline"><Settings size={16} /> CMS</Link> : null}
          {can("operations:view") ? <Link href="/admin/operasional" className="button button-outline"><FileText size={16} /> Operasional</Link> : null}
          {can("staff:manage") ? <Link href="/admin/petugas" className="button button-outline"><Users size={16} /> Petugas</Link> : null}
          {can("audit:view") ? <Link href="/admin/audit" className="button button-outline"><History size={16} /> Audit</Link> : null}
          <Link href="/" target="_blank" className="button button-outline"><Globe2 size={16} /> Website</Link>
          <button className="icon-button" type="button" onClick={logout} aria-label="Keluar"><LogOut size={18} /></button>
        </div>
      </div>
    </header>
  );
}
