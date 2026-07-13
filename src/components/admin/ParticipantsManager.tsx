"use client";

import { useMemo, useState } from "react";
import { Download, Search, Upload } from "lucide-react";
import type { Participant, RaffleGroup } from "@/lib/types";
import { Card, CardTitle } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";

export function ParticipantsManager({
  eventSlug,
  participants,
  groups,
}: {
  eventSlug: string;
  participants: Participant[];
  groups: RaffleGroup[];
}) {
  const [query, setQuery] = useState("");
  const [groupId, setGroupId] = useState("");
  const [mode, setMode] = useState("append");
  const [message, setMessage] = useState("");

  const filtered = useMemo(
    () =>
      participants.filter((participant) => {
        const text = `${participant.participant_code} ${participant.name} ${participant.phone ?? ""}`;
        return (
          (!groupId || participant.group_id === groupId) &&
          (!query || text.includes(query))
        );
      }),
    [participants, query, groupId],
  );

  async function importExcel(file: File | undefined) {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mode", mode);
    const response = await fetch(
      `/api/admin/events/${eventSlug}/participants/import`,
      { method: "POST", body: formData },
    );
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error ?? "导入失败");
      return;
    }
    setMessage(`导入成功 ${payload.successCount} 条，失败 ${payload.failCount} 条。`);
    setTimeout(() => location.reload(), 800);
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle>参与名单</CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            姓名和手机号仅后台可见，大屏不会读取这些数据。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            className="w-32"
            value={mode}
            onChange={(event) => setMode(event.target.value)}
          >
            <option value="append">追加导入</option>
            <option value="overwrite">覆盖导入</option>
          </Select>
          <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700">
            <Upload size={16} />
            Excel导入
            <input
              type="file"
              className="hidden"
              accept=".xlsx,.xls"
              onChange={(event) => importExcel(event.target.files?.[0])}
            />
          </label>
          <a
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            href={`/api/admin/events/${eventSlug}/participants/export`}
          >
            <Download size={16} />
            导出Excel
          </a>
          <a
            className="inline-flex h-10 items-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            href="/templates/participants-template.xlsx"
          >
            下载模板
          </a>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-slate-400" size={16} />
          <Input
            className="pl-9"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索姓名、编号或手机号"
          />
        </div>
        <Select value={groupId} onChange={(event) => setGroupId(event.target.value)}>
          <option value="">全部组别</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-slate-500">
            <tr>
              <th className="py-2">编号</th>
              <th>姓名</th>
              <th>手机号</th>
              <th>所属组别</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((participant) => (
              <tr key={participant.id}>
                <td className="py-2">{participant.participant_code}</td>
                <td>{participant.name}</td>
                <td>{participant.phone ?? "-"}</td>
                <td>{participant.group?.name ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {message && <p className="mt-3 text-sm text-blue-700">{message}</p>}
    </Card>
  );
}
