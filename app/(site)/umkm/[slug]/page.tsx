import Link from "next/link";
import { ArrowLeft, Camera, ExternalLink, MapPin, MessageCircle, ShoppingBag } from "lucide-react";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/public/PageHero";
import { getSiteData } from "@/lib/cms";

export const dynamic = "force-dynamic";

export default async function UmkmDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getSiteData();
  const item = data.umkm.find((entry) => entry.slug === slug && entry.status === "published");
  if (!item) notFound();
  const whatsappUrl = item.contactApproved && item.publicContact ? `https://wa.me/${item.publicContact.replace(/\D/g, "")}` : "";

  return (
    <>
      <PageHero eyebrow={item.category} title={item.name} description={item.featuredProduct}><Link href="/umkm" className="back-link"><ArrowLeft size={17} /> Kembali ke direktori</Link></PageHero>
      <section className="section"><div className="container product-detail">
        <div className="product-image"><img src={item.image || "/images/umkm-placeholder.svg"} alt={`Produk ${item.name}`} /></div>
        <div className="product-copy"><span className="category-label"><ShoppingBag size={15} /> {item.category}</span><h2>Tentang usaha</h2><p>{item.description}</p>{item.generalLocation ? <div className="product-location"><MapPin size={19} /><span><small>Lokasi umum</small>{item.generalLocation}</span></div> : null}<div className="action-row">{whatsappUrl ? <a className="button button-primary" href={whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle size={18} /> Hubungi UMKM</a> : null}{item.instagram ? <a className="button button-outline" href={item.instagram} target="_blank" rel="noreferrer"><Camera size={18} /> Instagram</a> : null}{item.marketplace ? <a className="button button-outline" href={item.marketplace} target="_blank" rel="noreferrer">Marketplace <ExternalLink size={17} /></a> : null}</div></div>
      </div></section>
    </>
  );
}
