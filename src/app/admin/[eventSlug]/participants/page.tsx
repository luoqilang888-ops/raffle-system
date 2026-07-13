import { AdminShell } from "@/components/admin/AdminShell";
import { ParticipantsManager } from "@/components/admin/ParticipantsManager";
import { requireUser } from "@/lib/auth";
import { getAdminEventSummary, getParticipants } from "@/lib/admin-data";

type Props = { params: Promise<{ eventSlug: string }> };

export default async function ParticipantsPage({ params }: Props) {
  await requireUser();
  const { eventSlug } = await params;
  const [summary, participants] = await Promise.all([
    getAdminEventSummary(eventSlug),
    getParticipants(eventSlug),
  ]);
  return (
    <AdminShell title="参与名单" eventSlug={eventSlug}>
      <ParticipantsManager
        eventSlug={eventSlug}
        participants={participants}
        groups={summary.groups}
      />
    </AdminShell>
  );
}
