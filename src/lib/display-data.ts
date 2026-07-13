import type { DisplayState } from "@/lib/types";
import { hasSupabaseServerEnv } from "@/lib/env";
import { demoDisplayState } from "@/lib/mock-data";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export async function getDisplayState(
  eventSlug: string,
  displayToken: string,
): Promise<DisplayState | null> {
  if (!hasSupabaseServerEnv()) return demoDisplayState;

  const supabase = createServiceSupabaseClient();
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id,name,slug,display_token")
    .eq("slug", eventSlug)
    .eq("display_token", displayToken)
    .single();

  if (eventError || !event) return null;

  const [
    { data: runtime },
    { data: session },
    { data: audioAssets },
    { data: connection },
  ] = await Promise.all([
    supabase.from("event_runtime").select("*").eq("event_id", event.id).maybeSingle(),
    supabase
      .from("draw_sessions")
      .select("*, prize:prizes(id,name,draw_count_per_round), results:draw_results(*, group:groups(id,name))")
      .eq("event_id", event.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("audio_assets")
      .select("*")
      .eq("event_id", event.id)
      .eq("enabled", true),
    supabase
      .from("display_connections")
      .select("last_seen_at")
      .eq("event_id", event.id)
      .order("last_seen_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const revealedGroups =
    session?.reveal_at && Date.now() >= new Date(session.reveal_at).getTime()
      ? (session.results ?? [])
          .filter((result: { revoked: boolean }) => !result.revoked)
          .map((result: { group: { id: string; name: string } }) => result.group)
      : [];

  const lastHeartbeatAt = connection?.last_seen_at ?? null;

  return {
    event,
    runtime,
    currentPrize: session?.prize
      ? { id: session.prize.id, name: session.prize.name }
      : null,
    currentSession: session,
    revealedGroups,
    audioAssets: audioAssets ?? [],
    displayOnline: lastHeartbeatAt
      ? Date.now() - new Date(lastHeartbeatAt).getTime() < 15_000
      : false,
    lastHeartbeatAt,
  };
}
