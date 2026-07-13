import { headers } from "next/headers";
import type {
  AdminEventSummary,
  AppEvent,
  AudioAsset,
  DrawResult,
  EventRuntime,
  Participant,
  Prize,
  RaffleGroup,
} from "@/lib/types";
import { getPublicEnv, hasSupabaseServerEnv } from "@/lib/env";
import { demoSummary } from "@/lib/mock-data";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export async function getOrigin() {
  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host");
  const proto = hdrs.get("x-forwarded-proto") ?? "http";
  return host ? `${proto}://${host}` : getPublicEnv().appUrl;
}

export async function getAdminEvents(): Promise<AppEvent[]> {
  if (!hasSupabaseServerEnv()) return [demoSummary.event];
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getAdminEventSummary(
  eventSlug: string,
): Promise<AdminEventSummary> {
  if (!hasSupabaseServerEnv()) return demoSummary;

  const supabase = createServiceSupabaseClient();
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("slug", eventSlug)
    .single();

  if (eventError) throw eventError;

  const [
    { data: runtime, error: runtimeError },
    { data: groups, error: groupsError },
    { data: prizes, error: prizesError },
    { data: records, error: recordsError },
    { data: connection },
  ] = await Promise.all([
    supabase.from("event_runtime").select("*").eq("event_id", event.id).maybeSingle(),
    supabase
      .from("groups")
      .select("*")
      .eq("event_id", event.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("prizes")
      .select("*")
      .eq("event_id", event.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("draw_results")
      .select("*, group:groups(id,name), prize:prizes(id,name)")
      .eq("event_id", event.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("display_connections")
      .select("last_seen_at")
      .eq("event_id", event.id)
      .order("last_seen_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (runtimeError) throw runtimeError;
  if (groupsError) throw groupsError;
  if (prizesError) throw prizesError;
  if (recordsError) throw recordsError;

  const lastHeartbeatAt = connection?.last_seen_at ?? null;
  const displayOnline = lastHeartbeatAt
    ? Date.now() - new Date(lastHeartbeatAt).getTime() < 15_000
    : false;

  return {
    event,
    runtime: runtime as EventRuntime | null,
    groups: (groups ?? []) as RaffleGroup[],
    prizes: (prizes ?? []) as Prize[],
    records: (records ?? []) as DrawResult[],
    displayOnline,
    lastHeartbeatAt,
  };
}

export async function getParticipants(eventSlug: string): Promise<Participant[]> {
  if (!hasSupabaseServerEnv()) return [];
  const summary = await getAdminEventSummary(eventSlug);
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("participants")
    .select("*, group:groups(id,name)")
    .eq("event_id", summary.event.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Participant[];
}

export async function getAudioAssets(eventSlug: string): Promise<AudioAsset[]> {
  if (!hasSupabaseServerEnv()) return [];
  const summary = await getAdminEventSummary(eventSlug);
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("audio_assets")
    .select("*")
    .eq("event_id", summary.event.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as AudioAsset[];
}
