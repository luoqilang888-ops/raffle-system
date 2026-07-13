"use client";

import { useRef, useState } from "react";
import { Play, Upload } from "lucide-react";
import type { AudioAsset } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";

export function AudioManager({
  eventSlug,
  assets,
}: {
  eventSlug: string;
  assets: AudioAsset[];
}) {
  const [role, setRole] = useState<"tension" | "reveal">("tension");
  const [name, setName] = useState("");
  const [volume, setVolume] = useState(0.7);
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File | undefined) {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", name || file.name);
    formData.append("audio_role", role);
    formData.append("volume", String(volume));
    const response = await fetch(`/api/admin/events/${eventSlug}/audio`, {
      method: "POST",
      body: formData,
    });
    const payload = await response.json();
    setMessage(response.ok ? "音频已上传。" : payload.error ?? "上传失败。");
    if (response.ok) setTimeout(() => location.reload(), 700);
  }

  function preview(url: string, previewVolume: number) {
    const audio = new Audio(url);
    audio.volume = previewVolume;
    void audio.play();
  }

  return (
    <Card>
      <div>
        <CardTitle>音乐设置</CardTitle>
        <p className="mt-1 text-sm text-slate-500">
          支持上传 MP3、WAV、M4A。项目不内置商业音乐，请上传已授权音频。
        </p>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-[1fr_160px_160px_auto]">
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="音频名称" />
        <Select value={role} onChange={(event) => setRole(event.target.value as "tension" | "reveal")}>
          <option value="tension">紧张音乐</option>
          <option value="reveal">揭晓音效</option>
        </Select>
        <Input
          type="number"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(event) => setVolume(Number(event.target.value))}
        />
        <Button onClick={() => inputRef.current?.click()} icon={<Upload size={16} />}>
          上传
        </Button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".mp3,.wav,.m4a,audio/*"
          onChange={(event) => upload(event.target.files?.[0])}
        />
      </div>

      <div className="mt-5 grid gap-3">
        {assets.map((asset) => (
          <div
            key={asset.id}
            className="flex items-center justify-between rounded-md border border-slate-200 p-3"
          >
            <div>
              <p className="font-medium text-slate-900">{asset.name}</p>
              <p className="text-sm text-slate-500">
                {asset.audio_role === "tension" ? "紧张音乐" : "揭晓音效"} · 音量 {asset.volume}
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => preview(asset.file_url, asset.volume)}
              icon={<Play size={16} />}
            >
              试听
            </Button>
          </div>
        ))}
      </div>
      {message && <p className="mt-3 text-sm text-blue-700">{message}</p>}
    </Card>
  );
}
