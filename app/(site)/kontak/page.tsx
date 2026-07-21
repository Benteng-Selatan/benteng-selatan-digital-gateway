import { Camera, Clock3, ExternalLink, Mail, MapPin, MessageCircle, MessagesSquare, Phone } from "lucide-react";
import { PageHero } from "@/components/public/PageHero";
import { getSiteData } from "@/lib/cms";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const data = await getSiteData();
  const contact = data.contact;
  const whatsappUrl = contact.whatsapp ? `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}` : "";
  const items = [
    { icon: MapPin, label: "Alamat kantor", value: contact.address || "Belum tersedia" },
    { icon: Clock3, label: "Jam pelayanan", value: contact.serviceHours || "Belum tersedia" },
    { icon: Phone, label: "Nomor resmi", value: contact.phone || "Belum tersedia" },
    { icon: Mail, label: "Email resmi", value: contact.email || "Belum tersedia" }
  ];
  return (
    <>
      <PageHero eyebrow="Kanal Resmi" title="Kontak Kelurahan" description="Gunakan kanal resmi berikut untuk memperoleh informasi. Form pengaduan daring belum disediakan pada versi awal." />
      <section className="section"><div className="container contact-layout">
        <div className="contact-cards">{items.map(({ icon: Icon, label, value }) => <article key={label}><span className="icon-box"><Icon size={21} /></span><div><small>{label}</small><strong>{value}</strong></div></article>)}</div>
        <div className="contact-panel"><h2>Hubungi dan ikuti kanal resmi</h2><p>Pastikan informasi penting dikonfirmasi melalui perangkat kelurahan.</p><div className="action-stack">{whatsappUrl ? <a className="button button-primary" href={whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle size={18} /> WhatsApp resmi</a> : null}{contact.instagram ? <a className="button button-outline" href={contact.instagram} target="_blank" rel="noreferrer"><Camera size={18} /> Instagram</a> : null}{contact.facebook ? <a className="button button-outline" href={contact.facebook} target="_blank" rel="noreferrer"><MessagesSquare size={18} /> Facebook</a> : null}{contact.mapsUrl ? <a className="button button-outline" href={contact.mapsUrl} target="_blank" rel="noreferrer"><ExternalLink size={18} /> Buka Google Maps</a> : null}{!whatsappUrl && !contact.instagram && !contact.facebook && !contact.mapsUrl ? <div className="empty-state small-empty">Kanal digital belum dimasukkan melalui CMS.</div> : null}</div></div>
      </div></section>
    </>
  );
}
