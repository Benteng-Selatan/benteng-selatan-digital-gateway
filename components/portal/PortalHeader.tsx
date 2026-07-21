"use client";

import Link from "next/link";
import { LogOut, ShieldCheck } from "lucide-react";

export function PortalHeader({ name }: { name?: string }) {
  async function logout() {
    await fetch("/api/citizen/logout", { method: "POST" });
    window.location.href = "/warga/masuk";
  }
  return (
    <header className="portal-header">
      <div className="container portal-header-inner">
        <Link href="/" className="brand">
          <span className="brand-mark"><ShieldCheck size={21} /></span>
          <span><strong>Portal Warga</strong><small>Benteng Selatan</small></span>
        </Link>
        <div className="portal-header-actions">
          {name ? <span className="portal-user-name">{name}</span> : null}
          <Link className="button button-outline" href="/">Website publik</Link>
          {name ? <button type="button" className="icon-button" onClick={logout} aria-label="Keluar"><LogOut size={18} /></button> : null}
        </div>
      </div>
    </header>
  );
}
