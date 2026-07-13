import { AdminShell } from "@/components/admin/AdminShell";
import { PrizesManager } from "@/components/admin/PrizesManager";
import { requireUser } from "@/lib/auth";
import { getAdminEventSummary } from "@/lib/admin-data";

type Props = { params: Promise<{ eventSlug: string }> };

export default async function PrizesPage({ params }: Props) {
  await requireUser();
  const { eventSlug } = await params;
  const summary = await getAdminEventSummary(eventSlug);
  return (
    <AdminShell title="奖项设置" eventSlug={eventSlug}>
      <PrizesManager eventSlug={eventSlug} prizes={summary.prizes} />
    </AdminShell>
  );
}
