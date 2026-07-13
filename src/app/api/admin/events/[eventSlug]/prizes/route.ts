import { NextRequest } from "next/server";
import { apiError, getEventBySlug, json, requireApiUser, upsertPrizeSchema } from "@/lib/api";
import { hasSupabaseServerEnv } from "@/lib/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

type Context = { params: Promise<{ eventSlug: string }> };

export async function POST(request: NextRequest, context: Context) {
  const auth = await requireApiUser(request);
  if ("error" in auth) return auth.error;
  const body = upsertPrizeSchema.safeParse(await request.json());
  if (!body.success) return apiError("奖项数据不完整。");
  if (!hasSupabaseServerEnv()) return json({ ok: true });

  const { eventSlug } = await context.params;
  const event = await getEventBySlug(eventSlug);
  const supabase = createServiceSupabaseClient();
  const payload = { ...body.data, event_id: event.id };
  const query = body.data.id
    ? supabase.from("prizes").update(payload).eq("id", body.data.id).select("*").single()
    : supabase.from("prizes").insert(payload).select("*").single();

  const { data, error } = await query;
  if (error) return apiError(error.message);
  return json({ prize: data });
}

export async function DELETE(request: NextRequest, context: Context) {
  const auth = await requireApiUser(request);
  if ("error" in auth) return auth.error;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return apiError("缺少奖项 ID。");
  if (!hasSupabaseServerEnv()) return json({ ok: true });

  const { eventSlug } = await context.params;
  await getEventBySlug(eventSlug);
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("prizes").delete().eq("id", id);
  if (error) return apiError(error.message);
  return json({ ok: true });
}
