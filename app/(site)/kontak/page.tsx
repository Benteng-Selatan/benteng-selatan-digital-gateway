import { Camera, Clock3, ExternalLink, Mail, MapPin, MessageCircle, MessagesSquare, Phone, PhoneCall, UserRound } from "lucide-react";
import { PageHero } from "@/components/public/PageHero";
import { SectionHeading } from "@/components/public/SectionHeading";
import { getSiteData } from "@/lib/cms";

export const dynamic = "force-dynamic";

function phoneUrl(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? `tel:${digits.startsWith("0") ? `+62${digits.slice(1)}` : digits}` : "";
}

export default async function ContactPage() {
  const data = await getSiteData();
  const contact = data.contact;
  const whatsappDigits = contact.whatsapp.replace(/\D/g, "");
  const whatsappUrl = whatsappDigits ? `https://wa.me/${whatsappDigits.startsWith("0") ? `62${whatsappDigits.slice(1)}` : whatsappDigits}` : "";
  const items = [
    { icon: MapPin, label: "Alamat kantor", value: contact.address || "Belum tersedia" },
    { icon: Clock3, label: "Jam pelayanan", value: contact.serviceHours || "Belum tersedia" },
    { icon: Phone, label: "Nomor resmi", value: contact.phone || "Belum tersedia" },
    { icon: Mail, label: "Email resmi", value: contact.email || "Belum tersedia" }
  ];
  return (
    <>
      <PageHero eyebrow="Kanal Resmi" title="Kontak Kelurahan" description="Hubungi perangkat Kelurahan Benteng Selatan melalui kanal yang tersedia untuk informasi awal dan bantuan pelayanan." />
      <section className="section"><div className="container contact-layout">
        <div className="contact-cards">{items.map(({ icon: Icon, label, value }) => <article key={label}><span className="icon-box"><Icon size={21} /></span><div><small>{label}</small><strong>{value}</strong></div></article>)}</div>
        <div className="contact-panel"><h2>Hubungi dan ikuti kanal resmi</h2><p>Pastikan informasi penting dikonfirmasi melalui perangkat kelurahan.</p><div className="action-stack">{whatsappUrl ? <a className="button button-primary" href={whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle size={18} /> WhatsApp resmi</a> : null}{contact.phone ? <a className="button button-outline" href={phoneUrl(contact.phone)}><PhoneCall size={18} /> Telepon kantor</a> : null}{contact.instagram ? <a className="button button-outline" href={contact.instagram} target="_blank" rel="noreferrer"><Camera size={18} /> Instagram</a> : null}{contact.facebook ? <a className="button button-outline" href={contact.facebook} target="_blank" rel="noreferrer"><MessagesSquare size={18} /> Facebook</a> : null}{contact.mapsUrl ? <a className="button button-outline" href={contact.mapsUrl} target="_blank" rel="noreferrer"><ExternalLink size={18} /> Buka Google Maps</a> : null}{!whatsappUrl && !contact.phone && !contact.instagram && !contact.facebook && !contact.mapsUrl ? <div className="empty-state small-empty">Kanal digital belum dimasukkan melalui CMS.</div> : null}</div></div>
      </div></section>

      {contact.officials.length ? <section className="section section-tinted"><div className="container">
        <SectionHeading eyebrow="Perangkat Kelurahan" title="Kontak yang dapat dihubungi" description="Daftar berikut bersumber dari data yang diberikan Kelurahan Benteng Selatan. Gunakan pada jam pelayanan dan sampaikan keperluan secara jelas." />
        <div className="official-contact-grid">
          {contact.officials.map((official) => {
            const href = phoneUrl(official.phone);
            return <article className="official-contact-card" key={official.id}>
              <span className="icon-box"><UserRound size={22} /></span>
              <div><small>{official.role}</small><h2>{official.name}</h2><p>{official.phone}</p></div>
              {href ? <a className="button button-outline" href={href}><PhoneCall size={17} /> Hubungi</a> : null}
            </article>;
          })}
        </div>
      </div></section> : null}
    </>
  );
}
