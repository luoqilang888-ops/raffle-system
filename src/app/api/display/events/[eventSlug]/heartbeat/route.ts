import { NextRequest } from "next/server";
import { apiError, json } from "@/lib/api";
import { hasSupabaseServerEnv } from "@/lib/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

type Context = { params: Promise<{ eventSlug: string }> };

export async function POST(request: NextRequest, context: Context) {
  const { eventSlug } = await context.params;
  const body = await request.json().catch(() => ({}));
  if (!body.displayToken) return apiError("缺少大屏访问令牌。", 401);
  if (!hasSupabaseServerEnv()) return json({ ok: true });

  const supabase = createServiceSupabaseClient();
  const { data: event, error } = await supabase
    .from("events")
    .select("id")
    .eq("slug", eventSlug)
    .eq("display_token", body.displayToken)
    .single();
  if (error || !event) return apiError("大屏链接无效。", 404);

  const connectionId = body.connectionId ?? crypto.randomUUID();
  const { error: upsertError } = await supabase
    .from("display_connections")
    .upsert(
      {
        event_id: event.id,
        connection_id: connectionId,
        last_seen_at: new Date().toISOString(),
        audio_unlocked: Boolean(body.audioUnlocked),
        user_agent: request.headers.get("user-agent") ?? "",
      },
      { onConflict: "event_id,connection_id" },
    );

  if (upsertError) return apiError(upsertError.message);
  return json({ ok: true, connectionId });
}
