import { AdminShell } from "@/components/admin/AdminShell";
import { RecordsTable } from "@/components/admin/RecordsTable";
import { requireUser } from "@/lib/auth";
import { getAdminEventSummary } from "@/lib/admin-data";

type Props = { params: Promise<{ eventSlug: string }> };

export default async function RecordsPage({ params }: Props) {
  await requireUser();
  const { eventSlug } = await params;
  const summary = await getAdminEventSummary(eventSlug);
  return (
    <AdminShell title="开奖记录" eventSlug={eventSlug}>
      <RecordsTable
        eventSlug={eventSlug}
        records={summary.records}
        prizes={summary.prizes}
        groups={summary.groups}
      />
    </AdminShell>
  );
}
