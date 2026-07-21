import { Footer } from "@/components/public/Footer";
import { Header } from "@/components/public/Header";
import { getSiteData } from "@/lib/cms";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const data = await getSiteData();
  return (
    <>
      <Header siteName={data.site.name} />
      <main>{children}</main>
      <Footer siteName={data.site.name} contact={data.contact} />
    </>
  );
}
