"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function EventCreateForm() {
  const router = useRouter();
  const [name, setName] = useState("会场抽奖");
  const [slug, setSlug] = useState("demo-event");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function createEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/admin/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, slug }),
    });
    const payload = await response.json();
    setLoading(false);
    if (!response.ok) {
      setMessage(payload.error ?? "创建失败");
      return;
    }
    router.push(`/admin/${payload.event.slug ?? slug}`);
    router.refresh();
  }

  return (
    <form onSubmit={createEvent} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
      <Input value={name} onChange={(event) => setName(event.target.value)} />
      <Input
        value={slug}
        onChange={(event) => setSlug(event.target.value)}
        pattern="[a-z0-9-]+"
      />
      <Button type="submit" disabled={loading} icon={<Plus size={16} />}>
        创建活动
      </Button>
      {message && <p className="md:col-span-3 text-sm text-rose-600">{message}</p>}
    </form>
  );
}
