import { Navbar } from "@/components/blog/Navbar";
import { Footer } from "@/components/blog/Footer";
import { getCategories } from "@/lib/queries";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategories();
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar categories={categories} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
