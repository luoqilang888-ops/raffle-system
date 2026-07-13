import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, getEventBySlug, json, requireApiUser } from "@/lib/api";
import { hasSupabaseServerEnv } from "@/lib/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

type Context = { params: Promise<{ eventSlug: string }> };

const audioSchema = z.object({
  name: z.string().min(1),
  audio_role: z.enum(["tension", "reveal"]),
  volume: z.coerce.number().min(0).max(1),
});

export async function POST(request: NextRequest, context: Context) {
  const auth = await requireApiUser(request);
  if ("error" in auth) return auth.error;
  const formData = await request.formData();
  const file = formData.get("file");
  const parsed = audioSchema.safeParse({
    name: formData.get("name"),
    audio_role: formData.get("audio_role"),
    volume: formData.get("volume") ?? 0.7,
  });
  if (!parsed.success) return apiError("音频信息不完整。");
  if (!(file instanceof File)) return apiError("请上传 MP3、WAV 或 M4A 文件。");

  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !["mp3", "wav", "m4a"].includes(extension)) {
    return apiError("仅支持 MP3、WAV 或 M4A。");
  }

  if (!hasSupabaseServerEnv()) return json({ ok: true });

  const { eventSlug } = await context.params;
  const event = await getEventBySlug(eventSlug);
  const supabase = createServiceSupabaseClient();
  const path = `${event.id}/${parsed.data.audio_role}-${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from("raffle-audio")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return apiError(uploadError.message);

  const { data: publicUrl } = supabase.storage
    .from("raffle-audio")
    .getPublicUrl(path);

  const { data, error } = await supabase
    .from("audio_assets")
    .insert({
      event_id: event.id,
      name: parsed.data.name,
      file_url: publicUrl.publicUrl,
      file_type: extension,
      audio_role: parsed.data.audio_role,
      volume: parsed.data.volume,
      enabled: true,
    })
    .select("*")
    .single();

  if (error) return apiError(error.message);
  return json({ asset: data });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireApiUser(request);
  if ("error" in auth) return auth.error;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return apiError("缺少音频 ID。");
  if (!hasSupabaseServerEnv()) return json({ ok: true });

  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("audio_assets").delete().eq("id", id);
  if (error) return apiError(error.message);
  return json({ ok: true });
}
