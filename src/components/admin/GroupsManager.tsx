"use client";

import { useState } from "react";
import { Save, Trash2 } from "lucide-react";
import type { RaffleGroup } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export function GroupsManager({
  eventSlug,
  groups,
}: {
  eventSlug: string;
  groups: RaffleGroup[];
}) {
  const [drafts, setDrafts] = useState<RaffleGroup[]>(groups);
  const [newName, setNewName] = useState("");
  const [message, setMessage] = useState("");

  async function save(group: Partial<RaffleGroup>) {
    const response = await fetch(`/api/admin/events/${eventSlug}/groups`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(group),
    });
    setMessage(response.ok ? "组别已保存。" : "保存失败。");
    if (response.ok) setTimeout(() => location.reload(), 500);
  }

  async function remove(id: string) {
    const response = await fetch(`/api/admin/events/${eventSlug}/groups?id=${id}`, {
      method: "DELETE",
    });
    setMessage(response.ok ? "组别已删除。" : "删除失败。");
    if (response.ok) setDrafts((items) => items.filter((item) => item.id !== id));
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div>
          <CardTitle>组别管理</CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            可新增、改名、禁用、排序；组别数量不固定。
          </p>
        </div>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!newName.trim()) return;
            void save({
              name: newName,
              participant_count: 0,
              enabled: true,
              sort_order: drafts.length + 1,
              allow_repeat_win: false,
            });
          }}
        >
          <Input
            className="w-44"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="新增组别"
          />
          <Button type="submit">新增</Button>
        </form>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-slate-500">
            <tr>
              <th className="py-2">排序</th>
              <th>组别名称</th>
              <th>人数</th>
              <th>参与抽奖</th>
              <th>允许重复中奖</th>
              <th className="text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {drafts.map((group, index) => (
              <tr key={group.id}>
                <td className="py-2">
                  <Input
                    className="w-20"
                    type="number"
                    value={group.sort_order}
                    onChange={(event) =>
                      setDrafts((items) =>
                        items.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, sort_order: Number(event.target.value) }
                            : item,
                        ),
                      )
                    }
                  />
                </td>
                <td>
                  <Input
                    value={group.name}
                    onChange={(event) =>
                      setDrafts((items) =>
                        items.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, name: event.target.value }
                            : item,
                        ),
                      )
                    }
                  />
                </td>
                <td>{group.participant_count}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={group.enabled}
                    onChange={(event) =>
                      setDrafts((items) =>
                        items.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, enabled: event.target.checked }
                            : item,
                        ),
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={Boolean(group.allow_repeat_win)}
                    onChange={(event) =>
                      setDrafts((items) =>
                        items.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, allow_repeat_win: event.target.checked }
                            : item,
                        ),
                      )
                    }
                  />
                </td>
                <td className="flex justify-end gap-2 py-2">
                  <Button
                    variant="secondary"
                    onClick={() => save(group)}
                    icon={<Save size={15} />}
                  >
                    保存
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => remove(group.id)}
                    icon={<Trash2 size={15} />}
                  >
                    删除
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {message && <p className="mt-3 text-sm text-blue-700">{message}</p>}
    </Card>
  );
}
