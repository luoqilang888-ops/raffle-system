import { AdminShell } from "@/components/admin/AdminShell";
import { GroupsManager } from "@/components/admin/GroupsManager";
import { requireUser } from "@/lib/auth";
import { getAdminEventSummary } from "@/lib/admin-data";

type Props = { params: Promise<{ eventSlug: string }> };

export default async function GroupsPage({ params }: Props) {
  await requireUser();
  const { eventSlug } = await params;
  const summary = await getAdminEventSummary(eventSlug);
  return (
    <AdminShell title="组别管理" eventSlug={eventSlug}>
      <GroupsManager eventSlug={eventSlug} groups={summary.groups} />
    </AdminShell>
  );
}
