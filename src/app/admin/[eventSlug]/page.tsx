import { AdminShell } from "@/components/admin/AdminShell";
import { ControlPanel } from "@/components/admin/ControlPanel";
import { Card, CardTitle } from "@/components/ui/Card";
import { requireUser } from "@/lib/auth";
import { getAdminEventSummary, getOrigin } from "@/lib/admin-data";

type Props = { params: Promise<{ eventSlug: string }> };

export default async function EventAdminPage({ params }: Props) {
  await requireUser();
  const { eventSlug } = await params;
  const [summary, origin] = await Promise.all([
    getAdminEventSummary(eventSlug),
    getOrigin(),
  ]);

  return (
    <AdminShell title={summary.event.name} eventSlug={eventSlug}>
      <div className="grid gap-5">
        <ControlPanel summary={summary} origin={origin} />
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardTitle>当前候选组别</CardTitle>
            <div className="mt-4 grid gap-2">
              {summary.groups
                .filter((group) => group.enabled)
                .map((group) => (
                  <div
                    key={group.id}
                    className="flex justify-between rounded-md bg-slate-50 px-3 py-2 text-sm"
                  >
                    <span>{group.name}</span>
                    <span className="text-slate-500">{group.participant_count} 人</span>
                  </div>
                ))}
            </div>
          </Card>
          <Card>
            <CardTitle>最近开奖记录</CardTitle>
            <div className="mt-4 grid gap-2">
              {summary.records.slice(0, 6).map((record) => (
                <div
                  key={record.id}
                  className="flex justify-between rounded-md bg-slate-50 px-3 py-2 text-sm"
                >
                  <span>{record.prize?.name ?? "-"}</span>
                  <span className="font-medium">{record.group?.name ?? "-"}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
