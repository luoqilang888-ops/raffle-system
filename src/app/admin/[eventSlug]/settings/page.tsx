import { AdminShell } from "@/components/admin/AdminShell";
import { SettingsPanel } from "@/components/admin/SettingsPanel";
import { Card, CardTitle } from "@/components/ui/Card";
import { requireUser } from "@/lib/auth";
import { getAdminEventSummary, getOrigin } from "@/lib/admin-data";
import { getDisplayUrl } from "@/lib/utils";

type Props = { params: Promise<{ eventSlug: string }> };

export default async function SettingsPage({ params }: Props) {
  await requireUser();
  const { eventSlug } = await params;
  const [summary, origin] = await Promise.all([
    getAdminEventSummary(eventSlug),
    getOrigin(),
  ]);
  return (
    <AdminShell title="系统设置" eventSlug={eventSlug}>
      <div className="grid gap-5">
        <SettingsPanel eventSlug={eventSlug} runtime={summary.runtime} />
        <Card>
          <CardTitle>稳定大屏链接</CardTitle>
          <p className="mt-3 break-all rounded-md bg-slate-50 p-3 text-sm text-slate-700">
            {getDisplayUrl(origin, summary.event.slug, summary.event.display_token)}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            链接由活动标识和数据库中的固定令牌组成。重新部署代码不会改变。
          </p>
        </Card>
      </div>
    </AdminShell>
  );
}
