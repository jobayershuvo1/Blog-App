import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasAtLeast } from "@/lib/constants";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  if (!hasAtLeast(session.user.role, "moderator")) redirect("/dashboard");
  return <AdminShell>{children}</AdminShell>;
}
