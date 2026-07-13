import { NextRequest } from "next/server";
import { apiError, json, requireApiUser } from "@/lib/api";
import { hasSupabaseServerEnv } from "@/lib/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

type Context = { params: Promise<{ eventSlug: string }> };

export async function POST(request: NextRequest, context: Context) {
  const auth = await requireApiUser(request);
  if ("error" in auth) return auth.error;
  const { eventSlug } = await context.params;
  const body = await request.json().catch(() => ({}));

  if (!hasSupabaseServerEnv()) return json({ ok: true, demo: true });

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase.rpc("start_draw_session", {
    p_event_slug: eventSlug,
    p_prize_id: body.prizeId ?? null,
    p_admin_id: auth.user.id,
  });

  if (error) return apiError(error.message, 409);
  return json({ session: data });
}
