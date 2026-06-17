import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasAtLeast } from "@/lib/constants";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dashboard");
  if (!hasAtLeast(session.user.role, "author")) redirect("/");
  return <DashboardShell>{children}</DashboardShell>;
}
