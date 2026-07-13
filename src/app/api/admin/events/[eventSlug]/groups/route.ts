import { NextRequest } from "next/server";
import { apiError, getEventBySlug, json, requireApiUser, upsertGroupSchema } from "@/lib/api";
import { hasSupabaseServerEnv } from "@/lib/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

type Context = { params: Promise<{ eventSlug: string }> };

export async function POST(request: NextRequest, context: Context) {
  const auth = await requireApiUser(request);
  if ("error" in auth) return auth.error;
  const body = upsertGroupSchema.safeParse(await request.json());
  if (!body.success) return apiError("组别数据不完整。");
  if (!hasSupabaseServerEnv()) return json({ ok: true });

  const { eventSlug } = await context.params;
  const event = await getEventBySlug(eventSlug);
  const supabase = createServiceSupabaseClient();
  const payload = { ...body.data, event_id: event.id };

  const query = body.data.id
    ? supabase.from("groups").update(payload).eq("id", body.data.id).select("*").single()
    : supabase.from("groups").insert(payload).select("*").single();

  const { data, error } = await query;
  if (error) return apiError(error.message);
  return json({ group: data });
}

export async function DELETE(request: NextRequest, context: Context) {
  const auth = await requireApiUser(request);
  if ("error" in auth) return auth.error;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return apiError("缺少组别 ID。");
  if (!hasSupabaseServerEnv()) return json({ ok: true });

  const { eventSlug } = await context.params;
  await getEventBySlug(eventSlug);
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("groups").delete().eq("id", id);
  if (error) return apiError(error.message);
  return json({ ok: true });
}
