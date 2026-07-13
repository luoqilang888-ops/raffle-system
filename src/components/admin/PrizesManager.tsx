"use client";

import { useState } from "react";
import { Copy, Save, Trash2 } from "lucide-react";
import type { Prize } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export function PrizesManager({
  eventSlug,
  prizes,
}: {
  eventSlug: string;
  prizes: Prize[];
}) {
  const [drafts, setDrafts] = useState(prizes);
  const [message, setMessage] = useState("");

  async function save(prize: Partial<Prize>) {
    const response = await fetch(`/api/admin/events/${eventSlug}/prizes`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(prize),
    });
    setMessage(response.ok ? "奖项已保存。" : "保存失败。");
    if (response.ok) setTimeout(() => location.reload(), 500);
  }

  async function remove(id: string) {
    const response = await fetch(`/api/admin/events/${eventSlug}/prizes?id=${id}`, {
      method: "DELETE",
    });
    setMessage(response.ok ? "奖项已删除。" : "删除失败。");
    if (response.ok) setDrafts((items) => items.filter((item) => item.id !== id));
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <CardTitle>奖项设置（可编辑）</CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            奖项名称、次数、每次抽取组数都可以现场调整。
          </p>
        </div>
        <Button
          onClick={() =>
            save({
              name: "惊喜奖",
              description: "可编辑奖品说明",
              total_draws: 1,
              draw_count_per_round: 1,
              enabled: true,
              sort_order: drafts.length + 1,
            })
          }
        >
          新增奖项
        </Button>
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-[920px] w-full text-left text-sm">
          <thead className="text-xs text-slate-500">
            <tr>
              <th className="py-2">奖项名称</th>
              <th>奖品说明</th>
              <th>总次数</th>
              <th>已抽</th>
              <th>剩余</th>
              <th>每次组数</th>
              <th>启用</th>
              <th>排序</th>
              <th className="text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {drafts.map((prize, index) => (
              <tr key={prize.id}>
                <td className="py-2">
                  <Input
                    value={prize.name}
                    onChange={(event) => update(index, { name: event.target.value })}
                  />
                </td>
                <td>
                  <Input
                    value={prize.description ?? ""}
                    onChange={(event) =>
                      update(index, { description: event.target.value })
                    }
                  />
                </td>
                <td>
                  <Input
                    className="w-20"
                    type="number"
                    value={prize.total_draws}
                    onChange={(event) =>
                      update(index, { total_draws: Number(event.target.value) })
                    }
                  />
                </td>
                <td>{prize.completed_draws}</td>
                <td>{Math.max(0, prize.total_draws - prize.completed_draws)}</td>
                <td>
                  <Input
                    className="w-20"
                    type="number"
                    value={prize.draw_count_per_round}
                    onChange={(event) =>
                      update(index, {
                        draw_count_per_round: Number(event.target.value),
                      })
                    }
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={prize.enabled}
                    onChange={(event) =>
                      update(index, { enabled: event.target.checked })
                    }
                  />
                </td>
                <td>
                  <Input
                    className="w-20"
                    type="number"
                    value={prize.sort_order}
                    onChange={(event) =>
                      update(index, { sort_order: Number(event.target.value) })
                    }
                  />
                </td>
                <td className="flex justify-end gap-2 py-2">
                  <Button
                    variant="secondary"
                    onClick={() => save(prize)}
                    icon={<Save size={15} />}
                  >
                    保存
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      save({
                        ...prize,
                        id: undefined,
                        name: `${prize.name} 副本`,
                        completed_draws: 0,
                      })
                    }
                    icon={<Copy size={15} />}
                  >
                    复制
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => remove(prize.id)}
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

  function update(index: number, patch: Partial<Prize>) {
    setDrafts((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    );
  }
}
