import { NextRequest } from "next/server";
import { apiError, createEventSchema, json, requireApiUser } from "@/lib/api";
import { fallbackToken } from "@/lib/utils";
import { hasSupabaseServerEnv } from "@/lib/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if ("error" in auth) return auth.error;
  const body = createEventSchema.safeParse(await request.json());
  if (!body.success) return apiError("活动名称或标识不正确。");

  if (!hasSupabaseServerEnv()) {
    return json({
      event: {
        id: "local-demo",
        ...body.data,
        display_token: fallbackToken(),
      },
    });
  }

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("events")
    .insert({
      ...body.data,
      display_token: fallbackToken(),
      status: "active",
      created_by: auth.user.id,
    })
    .select("*")
    .single();

  if (error) return apiError(error.message, 400);

  const { error: seedError } = await supabase.rpc("seed_event_defaults", {
    p_event_id: data.id,
  });
  if (seedError) return apiError(seedError.message, 400);

  return json({ event: data });
}
