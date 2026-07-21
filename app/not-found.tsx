import Link from "next/link";

export default function NotFound() {
  return <main className="login-page"><div className="login-card"><span className="brand-mark">404</span><h1>Halaman tidak ditemukan</h1><p>Konten mungkin masih berstatus draft, telah dihapus, atau alamatnya tidak tepat.</p><Link className="button button-primary" href="/">Kembali ke beranda</Link></div></main>;
}
