import { NextRequest } from "next/server";
import { apiError, getEventBySlug, json, requireApiUser, runtimePatchSchema } from "@/lib/api";
import { hasSupabaseServerEnv } from "@/lib/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

type Context = { params: Promise<{ eventSlug: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  const auth = await requireApiUser(request);
  if ("error" in auth) return auth.error;
  const body = runtimePatchSchema.safeParse(await request.json());
  if (!body.success) return apiError("设置数据不正确。");
  if (!hasSupabaseServerEnv()) return json({ ok: true });

  const { eventSlug } = await context.params;
  const event = await getEventBySlug(eventSlug);
  const supabase = createServiceSupabaseClient();
  const { data: current } = await supabase
    .from("event_runtime")
    .select("*")
    .eq("event_id", event.id)
    .single();

  const { data, error } = await supabase
    .from("event_runtime")
    .update({
      ...body.data,
      settings: {
        ...(current?.settings ?? {}),
        ...(body.data.settings ?? {}),
      },
      revision: (current?.revision ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("event_id", event.id)
    .select("*")
    .single();

  if (error) return apiError(error.message);
  return json({ runtime: data });
}
