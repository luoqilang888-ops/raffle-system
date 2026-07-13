import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { EventCreateForm } from "@/components/admin/EventCreateForm";
import { Card, CardTitle } from "@/components/ui/Card";
import { requireUser } from "@/lib/auth";
import { getAdminEvents } from "@/lib/admin-data";

export default async function AdminPage() {
  await requireUser();
  const events = await getAdminEvents();

  return (
    <AdminShell title="活动列表">
      <div className="grid gap-5">
        <Card>
          <CardTitle>创建活动</CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            活动标识用于生成稳定后台和大屏链接，只能使用小写英文、数字和短横线。
          </p>
          <div className="mt-5">
            <EventCreateForm />
          </div>
        </Card>
        <Card>
          <CardTitle>已有活动</CardTitle>
          <div className="mt-4 grid gap-3">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/admin/${event.slug}`}
                className="flex items-center justify-between rounded-md border border-slate-200 p-4 hover:border-blue-200 hover:bg-blue-50"
              >
                <span>
                  <span className="font-semibold">{event.name}</span>
                  <span className="ml-3 text-sm text-slate-500">{event.slug}</span>
                </span>
                <span className="text-sm text-blue-700">进入控制台</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}
