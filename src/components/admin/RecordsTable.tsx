"use client";

import type { DrawResult, Prize, RaffleGroup } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { formatDateTime } from "@/lib/utils";

export function RecordsTable({
  eventSlug,
  records,
}: {
  eventSlug: string;
  records: DrawResult[];
  prizes: Prize[];
  groups: RaffleGroup[];
}) {
  async function revoke(resultId: string) {
    await fetch(`/api/admin/events/${eventSlug}/records`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "revoke", resultId }),
    });
    location.reload();
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <CardTitle>开奖记录</CardTitle>
        <a
          className="inline-flex h-10 items-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          href={`/api/admin/events/${eventSlug}/records`}
        >
          导出Excel
        </a>
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-slate-500">
            <tr>
              <th className="py-2">奖项</th>
              <th>抽中组别</th>
              <th>抽奖时间</th>
              <th>状态</th>
              <th className="text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((record) => (
              <tr key={record.id}>
                <td className="py-2">{record.prize?.name ?? "-"}</td>
                <td>{record.group?.name ?? "-"}</td>
                <td>{formatDateTime(record.created_at)}</td>
                <td>{record.revoked ? "已撤销" : "有效"}</td>
                <td className="text-right">
                  <Button
                    variant="ghost"
                    disabled={record.revoked}
                    onClick={() => revoke(record.id)}
                  >
                    撤销结果
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
