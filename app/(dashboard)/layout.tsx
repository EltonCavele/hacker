import { redirect } from "next/navigation";
import { getSession, shouldOfferPasskey } from "@/features/auth/queries";
import { PushRegistrar } from "@/features/notifications/components/push-registrar";
import { DashboardSidebar } from "@/features/dashboard/components/dashboard-sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.user.onboardedAt) redirect("/onboarding");
  if (await shouldOfferPasskey(session)) redirect("/passkey");

  return (
    <div className="flex min-h-screen">
      <PushRegistrar />
      <DashboardSidebar user={{ name: session.user.name, email: session.user.email, image: session.user.image }} />
      {/* Content is centred at max-w-lg; the page header (data-slot=page-header-bar) is exempt so it spans the whole area. */}
      <main className="min-w-0 flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0 [&>:not([data-slot=page-header-bar])]:mx-auto [&>:not([data-slot=page-header-bar])]:max-w-lg">{children}</main>
    </div>
  );
}
