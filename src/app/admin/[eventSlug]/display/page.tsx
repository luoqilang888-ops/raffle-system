import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardTitle } from "@/components/ui/Card";
import { requireUser } from "@/lib/auth";
import { getAdminEventSummary, getOrigin } from "@/lib/admin-data";
import { getDisplayUrl } from "@/lib/utils";

type Props = { params: Promise<{ eventSlug: string }> };

export default async function DisplayPreviewPage({ params }: Props) {
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
    <AdminShell title="大屏预览" eventSlug={eventSlug}>
      <Card>
        <CardTitle>大屏预览</CardTitle>
        <p className="mt-2 text-sm text-slate-500">
          会场投影电脑应打开下面的正式大屏链接。预览窗口不包含任何后台控制按钮。
        </p>
        <div className="mt-5 aspect-video overflow-hidden rounded-lg border border-slate-200 bg-slate-950">
          <iframe src={displayUrl} title="大屏预览" className="h-full w-full" />
        </div>
        <p className="mt-4 break-all rounded-md bg-slate-50 p-3 text-sm text-slate-700">
          {displayUrl}
        </p>
      </Card>
    </AdminShell>
  );
}
