import Link from "next/link";
import { Clock3, ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import type { ContactData } from "@/lib/types";

export function Footer({ siteName, contact, bestiUrl }: { siteName: string; contact: ContactData; bestiUrl: string }) {
  const year = new Date().getFullYear();
  const contactItems = [
    { icon: MapPin, value: contact.address },
    { icon: Clock3, value: contact.serviceHours },
    { icon: Phone, value: contact.phone },
    { icon: Mail, value: contact.email },
  ].filter((item) => item.value.trim());

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <div className="brand footer-brand">
            <span className="brand-mark" aria-hidden="true">BS</span>
            <span>
              <strong>{siteName}</strong>
              <small>Informasi dan layanan Kelurahan Benteng Selatan.</small>
            </span>
          </div>
          <p className="muted footer-copy">
            Portal informasi dan layanan Kelurahan Benteng Selatan yang menghubungkan masyarakat dengan
            informasi pemerintahan, layanan publik, potensi wilayah, dan Kabar Kelurahan.
          </p>
        </div>
        <div>
          <h3>Tautan</h3>
          <div className="footer-links">
            <Link href="/layanan">Layanan Publik</Link>
            <a href={bestiUrl} target="_blank" rel="noreferrer">Pengurusan di BESTI <ExternalLink size={14} /></a>
            <Link href="/kesejahteraan">Kesejahteraan Sosial</Link>
            <Link href="/umkm">UMKM & Potensi</Link>
            <Link href="/peta">Peta Digital</Link>
            <Link href="/wisata">Kabar</Link>
          </div>
        </div>
        <div>
          <h3>Kontak Kelurahan</h3>
          {contactItems.length ? (
            <div className="footer-contact">
              {contactItems.map(({ icon: Icon, value }) => <p key={value}><Icon size={17} /> <span>{value}</span></p>)}
            </div>
          ) : <p className="muted">Kontak perangkat kelurahan tersedia pada halaman Kontak.</p>}
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {year} {siteName}</span>
        <Link href="/admin/login">CMS Admin</Link>
      </div>
    </footer>
  );
}
