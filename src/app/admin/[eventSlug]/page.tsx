import { AdminShell } from "@/components/admin/AdminShell";
import { ControlPanel } from "@/components/admin/ControlPanel";
import { Card, CardTitle } from "@/components/ui/Card";
import { requireUser } from "@/lib/auth";
import { getAdminEventSummary, getOrigin } from "@/lib/admin-data";
import { getDisplayUrl } from "@/lib/utils";

type Props = { params: Promise<{ eventSlug: string }> };

export default async function EventAdminPage({ params }: Props) {
  await requireUser();
  const { eventSlug } = await params;
  const [summary, origin] = await Promise.all([
    getAdminEventSummary(eventSlug),
    getOrigin(),
  ]);
  const displayUrl = getDisplayUrl(
    origin,
    summary.event.slug,
    summary.event.display_token,
  );

  return (
    <AdminShell title={summary.event.name} eventSlug={eventSlug}>
      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <div className="grid min-w-0 gap-5">
          <Card>
            <div className="flex items-center justify-between">
              <CardTitle>组别管理</CardTitle>
              <a
                href={`/admin/${eventSlug}/groups`}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                编辑组别
              </a>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3 2xl:grid-cols-6">
              {summary.groups
                .slice(0, 6)
                .map((group) => (
                  <div
                    key={group.id}
                    className="rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm"
                  >
                    <p className="text-sm font-bold text-slate-950">{group.name}</p>
                    <p className="mt-5 flex items-end gap-2">
                      <span className="text-3xl font-black text-blue-600">
                        {group.participant_count}
                      </span>
                      <span className="pb-1 text-sm font-medium text-slate-500">人</span>
                    </p>
                  </div>
                ))}
            </div>
          </Card>

          <ControlPanel summary={summary} origin={origin} />
        </div>

        <aside className="grid content-start gap-5">
          <Card>
            <div className="flex items-center justify-between">
              <CardTitle>大屏预览</CardTitle>
              <a
                href={`/admin/${eventSlug}/display`}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                全屏预览
              </a>
            </div>
            <div className="mt-4 aspect-video overflow-hidden rounded-lg bg-slate-950">
              <iframe
                src={displayUrl}
                title="大屏预览"
                className="h-full w-full"
              />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <CardTitle>开奖记录</CardTitle>
              <a
                href={`/admin/${eventSlug}/records`}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                查看全部
              </a>
            </div>
            <div className="mt-5 grid gap-3">
              {summary.records.slice(0, 6).map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-4 py-3 text-sm shadow-sm"
                >
                  <span className="font-semibold text-slate-700">
                    {record.group?.name ?? "-"}
                  </span>
                  <span className="text-slate-500">{record.prize?.name ?? "-"}</span>
                </div>
              ))}
              {summary.records.length === 0 && (
                <p className="rounded-lg bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  暂无开奖记录
                </p>
              )}
            </div>
          </Card>
        </aside>
      </div>
    </AdminShell>
  );
}
