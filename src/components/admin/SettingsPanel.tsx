"use client";

import { useState } from "react";
import type { EventRuntime } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

const numericFields = [
  ["acceleration_ms", "加速时间（毫秒）"],
  ["deceleration_ms", "减速时间（毫秒）"],
  ["suspense_ms", "悬念停顿（毫秒）"],
  ["shake_strength", "轻微震动强度"],
  ["tension_volume", "紧张音乐音量"],
  ["reveal_volume", "揭晓音效音量"],
] as const;

const booleanFields = [
  ["animation_enabled", "开启动画"],
  ["music_enabled", "开启音乐"],
  ["keyboard_shortcuts_enabled", "启用后台快捷键"],
  ["allow_group_repeat_win", "允许同组重复中奖"],
  ["exclude_prize_winners", "排除本奖项已中奖组"],
  ["exclude_event_winners", "排除整场已中奖组"],
] as const;

export function SettingsPanel({
  eventSlug,
  runtime,
}: {
  eventSlug: string;
  runtime: EventRuntime | null;
}) {
  const [settings, setSettings] = useState(runtime?.settings);
  const [message, setMessage] = useState("");

  if (!settings) {
    return (
      <Card>
        <CardTitle>系统设置</CardTitle>
        <p className="mt-2 text-sm text-slate-500">活动运行参数尚未初始化。</p>
      </Card>
    );
  }

  async function save() {
    const response = await fetch(`/api/admin/events/${eventSlug}/runtime`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ settings }),
    });
    setMessage(response.ok ? "设置已保存。" : "保存失败。");
  }

  return (
    <Card>
      <CardTitle>系统设置</CardTitle>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {numericFields.map(([key, label]) => (
          <label key={key} className="text-sm font-medium text-slate-700">
            {label}
            <Input
              className="mt-1"
              type="number"
              step={key.includes("volume") ? "0.05" : "1"}
              value={settings[key]}
              onChange={(event) =>
                setSettings({ ...settings, [key]: Number(event.target.value) })
              }
            />
          </label>
        ))}
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {booleanFields.map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={Boolean(settings[key])}
              onChange={(event) =>
                setSettings({ ...settings, [key]: event.target.checked })
              }
            />
            {label}
          </label>
        ))}
      </div>
      <div className="mt-5">
        <Button onClick={save}>保存设置</Button>
        {message && <p className="mt-3 text-sm text-blue-700">{message}</p>}
      </div>
    </Card>
  );
}
