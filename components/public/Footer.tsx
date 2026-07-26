import Link from "next/link";
import { Clock3, Mail, MapPin, Phone } from "lucide-react";
import type { ContactData } from "@/lib/types";

export function Footer({ siteName, contact }: { siteName: string; contact: ContactData }) {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <div className="brand footer-brand">
            <span className="brand-mark" aria-hidden="true">BS</span>
            <span>
              <strong>{siteName}</strong>
              <small>Informasi publik yang aman dan mudah diakses.</small>
            </span>
          </div>
          <p className="muted footer-copy">
            Portal ini menyajikan informasi layanan, data agregat, direktori UMKM, peta fasilitas,
            dan potensi lokal. Data individual warga tidak ditampilkan.
          </p>
        </div>
        <div>
          <h3>Tautan</h3>
          <div className="footer-links">
            <Link href="/layanan">Layanan Publik</Link>
            <Link href="/kesejahteraan">Kesejahteraan Sosial</Link>
            <Link href="/umkm">UMKM & Potensi</Link>
            <Link href="/peta">Peta Digital</Link>
            <Link href="/wisata">Kabar</Link>
          </div>
        </div>
        <div>
          <h3>Kontak Kelurahan</h3>
          <div className="footer-contact">
            <p><MapPin size={17} /> <span>{contact.address || "Alamat belum tersedia"}</span></p>
            <p><Clock3 size={17} /> <span>{contact.serviceHours || "Jam layanan belum tersedia"}</span></p>
            <p><Phone size={17} /> <span>{contact.phone || "Nomor resmi belum tersedia"}</span></p>
            <p><Mail size={17} /> <span>{contact.email || "Email resmi belum tersedia"}</span></p>
          </div>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {year} {siteName}</span>
        <Link href="/admin/login">CMS Admin</Link>
      </div>
    </footer>
  );
}
