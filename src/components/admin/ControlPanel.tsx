"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, ExternalLink, Maximize2, RotateCcw, Square, Zap } from "lucide-react";
import type { AdminEventSummary } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Select } from "@/components/ui/Input";
import { StatusPill } from "@/components/ui/StatusPill";
import { formatDateTime, getDisplayUrl } from "@/lib/utils";

export function ControlPanel({
  summary,
  origin,
}: {
  summary: AdminEventSummary;
  origin: string;
}) {
  const [selectedPrizeId, setSelectedPrizeId] = useState(
    summary.runtime?.current_prize_id ?? summary.prizes[0]?.id ?? "",
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const displayUrl = getDisplayUrl(
    origin,
    summary.event.slug,
    summary.event.display_token,
  );
  const currentPrize = useMemo(
    () => summary.prizes.find((prize) => prize.id === selectedPrizeId),
    [selectedPrizeId, summary.prizes],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!summary.runtime?.settings.keyboard_shortcuts_enabled) return;
      if (event.target instanceof HTMLInputElement) return;
      if (event.code === "Space") {
        event.preventDefault();
        if (summary.runtime?.phase === "spinning") {
          void runAction("stop");
        } else {
          void runAction("start");
        }
      }
      if (event.key === "Escape") void patchRuntime({ phase: "emergency" });
      if (event.key.toLowerCase() === "r") void patchRuntime({ phase: "idle" });
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  async function runAction(action: "start" | "stop") {
    setBusy(action);
    setMessage("");
    const response = await fetch(
      `/api/admin/events/${summary.event.slug}/draw/${action}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prizeId: selectedPrizeId }),
      },
    );
    const payload = await response.json();
    setBusy(null);
    if (!response.ok) {
      setMessage(payload.error ?? "操作失败");
      return;
    }
    setMessage(action === "start" ? "已发送开始抽奖命令。" : "已进入减速揭晓流程。");
    setTimeout(() => location.reload(), 700);
  }

  async function patchRuntime(payload: Record<string, unknown>) {
    setBusy("runtime");
    await fetch(`/api/admin/events/${summary.event.slug}/runtime`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(null);
    setTimeout(() => location.reload(), 300);
  }

  async function copyDisplayUrl() {
    await navigator.clipboard.writeText(displayUrl);
    setMessage("大屏链接已复制。");
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="当前活动" value={summary.event.name} />
        <Stat label="当前状态" value={phaseLabel(summary.runtime?.phase)} />
        <Stat label="参与组别" value={`${summary.groups.filter((group) => group.enabled).length} 组`} />
        <Stat
          label="大屏连接"
          value={summary.displayOnline ? "在线" : "离线"}
          active={summary.displayOnline}
        />
      </div>

      <Card>
        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>现场控制</CardTitle>
                <p className="mt-1 text-sm text-slate-500">
                  停止后会先减速、停顿，再按统一揭晓时间显示结果。
                </p>
              </div>
              <StatusPill active={summary.runtime?.phase === "spinning"}>
                {phaseLabel(summary.runtime?.phase)}
              </StatusPill>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                当前奖项
              </label>
              <Select
                value={selectedPrizeId}
                onChange={(event) => setSelectedPrizeId(event.target.value)}
              >
                {summary.prizes.map((prize) => (
                  <option key={prize.id} value={prize.id}>
                    {prize.name}（剩余 {Math.max(0, prize.total_draws - prize.completed_draws)} 次）
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid gap-3 md:grid-cols-5">
              <Button
                className="h-24 flex-col rounded-lg bg-blue-600 text-base shadow-[0_14px_30px_rgba(37,99,235,0.24)] hover:bg-blue-700"
                onClick={() => runAction("start")}
                disabled={Boolean(busy) || !currentPrize}
                icon={<Zap size={16} />}
              >
                开始抽奖
              </Button>
              <Button
                className="h-24 flex-col rounded-lg bg-red-500 text-base text-white shadow-[0_14px_30px_rgba(239,68,68,0.22)] hover:bg-red-600"
                onClick={() => runAction("stop")}
                disabled={Boolean(busy)}
                icon={<Square size={16} />}
              >
                停止抽奖
              </Button>
              <Button
                variant="secondary"
                className="h-24 flex-col rounded-lg bg-white text-slate-700"
                onClick={() => patchRuntime({ phase: "idle" })}
                disabled={Boolean(busy)}
                icon={<RotateCcw size={16} />}
              >
                返回等待页面
              </Button>
              <Button
                variant="secondary"
                className="h-24 flex-col rounded-lg bg-white text-slate-700"
                onClick={copyDisplayUrl}
                disabled={Boolean(busy)}
                icon={<Copy size={16} />}
              >
                复制链接
              </Button>
              <Button
                variant="secondary"
                className="h-24 flex-col rounded-lg bg-white text-slate-700"
                onClick={() => window.open(displayUrl, "_blank")}
                disabled={Boolean(busy)}
                icon={<ExternalLink size={16} />}
              >
                打开大屏
              </Button>
            </div>
            {message && <p className="text-sm text-blue-700">{message}</p>}
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-800">大屏链接</p>
            <p className="mt-2 break-all rounded-md bg-white p-3 text-xs text-slate-600">
              {displayUrl}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={copyDisplayUrl} icon={<Copy size={15} />}>
                复制
              </Button>
              <Button
                variant="secondary"
                onClick={() => window.open(displayUrl, "_blank")}
                icon={<ExternalLink size={15} />}
              >
                打开
              </Button>
              <Button
                variant="secondary"
                onClick={() => window.open(displayUrl, "_blank", "fullscreen=yes")}
                icon={<Maximize2 size={15} />}
              >
                全屏预览
              </Button>
              <Button variant="secondary" disabled>
                重生成令牌
              </Button>
            </div>
            <Button
              variant="danger"
              className="mt-3 w-full"
              onClick={() => patchRuntime({ phase: "emergency" })}
              disabled={Boolean(busy)}
            >
              紧急停止动画
            </Button>
            <p className="mt-3 text-xs text-slate-500">
              最后心跳：{formatDateTime(summary.lastHeartbeatAt)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active?: boolean;
}) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-blue-600">{value}</p>
      {typeof active === "boolean" && (
        <p className={active ? "mt-1 text-xs text-emerald-600" : "mt-1 text-xs text-slate-500"}>
          {active ? "连接正常" : "等待大屏心跳"}
        </p>
      )}
    </Card>
  );
}

function phaseLabel(phase?: string | null) {
  const labels: Record<string, string> = {
    idle: "等待抽奖",
    accelerating: "加速中",
    spinning: "抽奖进行中",
    decelerating: "即将揭晓",
    suspense: "悬念停顿",
    revealed: "已揭晓",
    emergency: "已紧急停止",
  };
  return phase ? labels[phase] ?? phase : "未初始化";
}
