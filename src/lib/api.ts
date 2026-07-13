import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { hasSupabaseServerEnv } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase/server";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireApiUser(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const limited = rateLimit(`api:${ip}`, 120, 60_000);
  if (!limited.allowed) {
    return { error: apiError("请求过于频繁，请稍后再试。", 429) };
  }

  if (!hasSupabaseServerEnv()) {
    return { user: { id: "local-demo-admin", email: "local@example.com" } };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: apiError("请先登录管理员账号。", 401) };
  }

  return { user };
}

export async function getEventBySlug(eventSlug: string) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("slug", eventSlug)
    .single();

  if (error) throw error;
  return data;
}

export const createEventSchema = z.object({
  name: z.string().min(1).max(80),
  slug: z
    .string()
    .min(2)
    .max(64)
    .regex(/^[a-z0-9-]+$/),
});

export const upsertGroupSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(40),
  participant_count: z.coerce.number().int().min(0).default(0),
  enabled: z.boolean().default(true),
  sort_order: z.coerce.number().int().min(0).default(0),
  allow_repeat_win: z.boolean().default(false),
});

export const upsertPrizeSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(60),
  description: z.string().max(240).optional().nullable(),
  total_draws: z.coerce.number().int().min(1).max(999),
  draw_count_per_round: z.coerce.number().int().min(1).max(20),
  enabled: z.boolean().default(true),
  sort_order: z.coerce.number().int().min(0).default(0),
});

export const runtimePatchSchema = z.object({
  phase: z
    .enum([
      "idle",
      "accelerating",
      "spinning",
      "decelerating",
      "suspense",
      "revealed",
      "emergency",
    ])
    .optional(),
  current_prize_id: z.string().uuid().nullable().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});
