import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Benteng Selatan Digital Gateway",
    template: "%s | Benteng Selatan Digital Gateway"
  },
  description: "Portal informasi layanan publik, UMKM, data sosial agregat, peta, dan potensi lokal Kelurahan Benteng Selatan."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
