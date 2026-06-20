import { Navbar } from "@/components/blog/Navbar";
import { Footer } from "@/components/blog/Footer";
import { getCategories } from "@/lib/queries";
import { getAdsense } from "@/lib/adsense";
import { AdSlot } from "@/components/ads/AdSlot";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategories();
  const ads = await getAdsense();
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar categories={categories} />
      {ads.slots.header && (
        <div className="container-prose pt-4">
          <AdSlot publisherId={ads.publisherId} slot={ads.slots.header} className="min-h-[90px]" />
        </div>
      )}
      <main className="flex-1">{children}</main>
      {ads.slots.footer && (
        <div className="container-prose py-4">
          <AdSlot publisherId={ads.publisherId} slot={ads.slots.footer} className="min-h-[90px]" />
        </div>
      )}
      <Footer />
    </div>
  );
}
