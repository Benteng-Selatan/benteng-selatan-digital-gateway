"use client";

import Link from "next/link";
import { ExternalLink, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navigation = [
  ["Beranda", "/"],
  ["Profil", "/profil"],
  ["Layanan", "/layanan"],
  ["Sosial", "/kesejahteraan"],
  ["Kependudukan", "/kependudukan"],
  ["UMKM & Potensi", "/umkm"],
  ["Peta", "/peta"],
  ["Kabar", "/wisata"],
  ["Kontak", "/kontak"]
] as const;

export function Header({ siteName, bestiUrl }: { siteName: string; bestiUrl: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark" aria-hidden="true">BS</span>
          <span>
            <strong>{siteName}</strong>
            <small>Portal Informasi Kelurahan</small>
          </span>
        </Link>

        <button
          type="button"
          className="mobile-menu-button"
          aria-label={open ? "Tutup menu" : "Buka menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={23} /> : <Menu size={23} />}
        </button>

        <nav className={`main-nav ${open ? "is-open" : ""}`} aria-label="Navigasi utama">
          {navigation.map(([label, href]) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={active ? "active" : ""}
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            );
          })}
          <a href={bestiUrl} className="portal-nav-link" target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>BESTI <ExternalLink size={15} /></a>
        </nav>
      </div>
    </header>
  );
}
