"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DisplayState, RuntimePhase } from "@/lib/types";
import { hasSupabasePublicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/browser";
import { LotteryMachine } from "@/components/display/LotteryMachine";

export function DisplayClient({
  initialState,
  eventSlug,
  displayToken,
}: {
  initialState: DisplayState;
  eventSlug: string;
  displayToken: string;
}) {
  const [state, setState] = useState(initialState);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [connectionId] = useState(() => crypto.randomUUID());
  const tensionRef = useRef<HTMLAudioElement | null>(null);
  const revealRef = useRef<HTMLAudioElement | null>(null);
  const [localPhase, setLocalPhase] = useState<RuntimePhase>(initialState.runtime.phase);

  const tensionAudio = useMemo(
    () => state.audioAssets.find((asset) => asset.audio_role === "tension"),
    [state.audioAssets],
  );
  const revealAudio = useMemo(
    () => state.audioAssets.find((asset) => asset.audio_role === "reveal"),
    [state.audioAssets],
  );
  const visibleGroups = localPhase === "revealed" ? state.revealedGroups : [];

  useEffect(() => {
    let cancelled = false;
    async function pull() {
      const response = await fetch(
        `/api/display/events/${eventSlug}?displayToken=${displayToken}`,
      );
      if (!cancelled && response.ok) {
        const payload = await response.json();
        setState(payload.state);
      }
    }
    const timer = window.setInterval(pull, 1800);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [displayToken, eventSlug]);

  useEffect(() => {
    if (!hasSupabasePublicEnv()) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`display:${state.event.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "event_runtime",
          filter: `event_id=eq.${state.event.id}`,
        },
        () => {
          void fetch(`/api/display/events/${eventSlug}?displayToken=${displayToken}`)
            .then((response) => response.json())
            .then((payload) => setState(payload.state));
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [displayToken, eventSlug, state.event.id]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void fetch(`/api/display/events/${eventSlug}/heartbeat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ displayToken, connectionId, audioUnlocked }),
      });
    }, 5000);
    return () => window.clearInterval(timer);
  }, [audioUnlocked, connectionId, displayToken, eventSlug]);

  useEffect(() => {
    const runtimePhase = state.runtime.phase;
    if (runtimePhase === "spinning") {
      const start = window.setTimeout(() => setLocalPhase("accelerating"), 0);
      const timer = window.setTimeout(() => setLocalPhase("spinning"), state.runtime.settings.acceleration_ms);
      return () => {
        window.clearTimeout(start);
        window.clearTimeout(timer);
      };
    }
    if (runtimePhase === "decelerating" || runtimePhase === "suspense") {
      const start = window.setTimeout(() => setLocalPhase("decelerating"), 0);
      const decel = window.setTimeout(
        () => setLocalPhase("suspense"),
        state.runtime.settings.deceleration_ms,
      );
      const revealDelay = state.currentSession?.reveal_at
        ? Math.max(0, new Date(state.currentSession.reveal_at).getTime() - Date.now())
        : state.runtime.settings.deceleration_ms + state.runtime.settings.suspense_ms;
      const reveal = window.setTimeout(() => setLocalPhase("revealed"), revealDelay);
      return () => {
        window.clearTimeout(start);
        window.clearTimeout(decel);
        window.clearTimeout(reveal);
      };
    }
    const reset = window.setTimeout(() => setLocalPhase(runtimePhase), 0);
    return () => window.clearTimeout(reset);
  }, [state]);

  useEffect(() => {
    if (!audioUnlocked || !state.runtime.settings.music_enabled) return;
    if (localPhase === "accelerating" || localPhase === "spinning") {
      const audio = tensionRef.current;
      if (audio && tensionAudio) {
        audio.volume = tensionAudio.volume;
        audio.loop = true;
        void audio.play().catch(() => undefined);
      }
    }
    if (localPhase === "revealed") {
      tensionRef.current?.pause();
      if (revealRef.current && revealAudio) {
        revealRef.current.volume = revealAudio.volume;
        void revealRef.current.play().catch(() => undefined);
      }
    }
    if (localPhase === "idle" || localPhase === "emergency") {
      tensionRef.current?.pause();
    }
  }, [audioUnlocked, localPhase, revealAudio, state.runtime.settings.music_enabled, tensionAudio]);

  async function enterVenueMode() {
    setAudioUnlocked(true);
    await tensionRef.current?.load();
    await revealRef.current?.load();
    await document.documentElement.requestFullscreen?.().catch(() => undefined);
  }

  return (
    <main className="display-screen relative min-h-screen overflow-hidden bg-[#070b12] text-white">
      {tensionAudio && <audio ref={tensionRef} src={tensionAudio.file_url} preload="auto" />}
      {revealAudio && <audio ref={revealRef} src={revealAudio.file_url} preload="auto" />}

      {!audioUnlocked && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#070b12] bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.12),transparent_42%)]">
          <div className="text-center">
            <p className="text-5xl font-semibold tracking-[0.12em] text-amber-100 drop-shadow-[0_0_28px_rgba(251,191,36,0.35)]">
              会场抽奖
            </p>
            <button
              className="mt-10 rounded-full border border-amber-200/70 bg-gradient-to-b from-amber-300 to-amber-700 px-10 py-4 text-lg font-semibold text-white shadow-[0_0_35px_rgba(245,158,11,0.45)] transition hover:brightness-110"
              onClick={enterVenueMode}
            >
              点击进入会场模式并启用音效
            </button>
          </div>
        </div>
      )}

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,237,213,0.11),transparent_32%),radial-gradient(circle_at_18%_76%,rgba(245,158,11,0.1),transparent_34%),linear-gradient(180deg,#070b12_0%,#0c121d_43%,#090b10_100%)]" />
      <div className="absolute inset-x-0 top-[15%] h-[36%] rounded-b-[50%] bg-black/25 blur-sm" />
      <div className="absolute inset-x-0 bottom-0 h-[28%] bg-[radial-gradient(ellipse_at_center,rgba(217,119,6,0.16),transparent_62%),linear-gradient(180deg,transparent,rgba(0,0,0,0.58))]" />
      <div className="relative flex min-h-screen flex-col px-[5vw] py-[4vh]">
        <header className="flex items-center justify-center gap-12">
          <span className="h-px w-[19vw] bg-gradient-to-r from-transparent via-amber-300 to-amber-50 shadow-[0_0_12px_rgba(251,191,36,0.75)]" />
          <h1 className="text-center text-[clamp(3.2rem,5.8vw,6.2rem)] font-black tracking-[0.16em] text-amber-100 drop-shadow-[0_5px_0_rgba(120,53,15,0.36)]">
            会场抽奖
          </h1>
          <span className="h-px w-[19vw] bg-gradient-to-l from-transparent via-amber-300 to-amber-50 shadow-[0_0_12px_rgba(251,191,36,0.75)]" />
        </header>

        <div className="grid flex-1 grid-cols-[1.08fr_0.92fr] items-center gap-[5vw] pb-[7vh] pt-[2vh]">
          <section className="flex min-w-0 flex-col items-center justify-center">
            <div className="relative h-[57vh] w-[57vh] max-h-[620px] max-w-full">
              <div className="absolute -inset-10 rounded-full bg-amber-500/10 blur-3xl" />
              <LotteryMachine
                phase={state.runtime.settings.animation_enabled ? localPhase : "idle"}
                shakeStrength={state.runtime.settings.shake_strength}
              />
            </div>
            <div className="relative -mt-8 w-[min(56vh,560px)] rounded-full border border-amber-200/30 bg-black/40 px-8 py-4 text-center shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
              <span className="mx-4 text-amber-300">•</span>
              <span className="text-[clamp(1.35rem,2vw,2rem)] font-semibold tracking-[0.12em] text-amber-100">
                {phaseText(localPhase)}
              </span>
              <span className="mx-4 text-amber-300">•</span>
            </div>
          </section>

          <aside className="flex min-w-0 items-center justify-center">
            <div className="relative w-full max-w-[720px] overflow-hidden rounded-[2rem] border border-amber-200/80 bg-[linear-gradient(145deg,rgba(36,32,29,0.92),rgba(12,13,16,0.92))] px-[5vw] py-[7vh] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_0_42px_rgba(245,158,11,0.18),inset_0_1px_0_rgba(255,255,255,0.08)]">
              <div className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-amber-200 to-transparent" />
              <div className="absolute inset-y-10 right-0 w-px bg-gradient-to-b from-transparent via-amber-200/70 to-transparent" />
              <div className="absolute inset-y-10 left-0 w-px bg-gradient-to-b from-transparent via-amber-200/70 to-transparent" />
              {visibleGroups.length === 0 ? (
                <div className="min-h-[32vh] py-8 text-center">
                  <div className="flex items-center justify-center gap-5">
                    <span className="h-px w-28 bg-gradient-to-r from-transparent to-amber-300" />
                    <p className="text-[clamp(1.5rem,2.2vw,2.25rem)] font-semibold tracking-[0.08em] text-amber-100">
                      {localPhase === "idle" ? "等待抽奖" : "抽奖进行中"}
                    </p>
                    <span className="h-px w-28 bg-gradient-to-l from-transparent to-amber-300" />
                  </div>
                  <p className="mt-16 text-[clamp(3.8rem,7vw,7.6rem)] font-black tracking-[0.04em] text-amber-50/95 drop-shadow-[0_0_26px_rgba(251,191,36,0.22)]">
                    待揭晓
                  </p>
                  {localPhase !== "idle" && (
                    <div className="mx-auto mt-10 flex w-24 justify-between">
                      {[0, 1, 2].map((item) => (
                        <motion.span
                          key={item}
                          className="h-3 w-3 rounded-full bg-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.9)]"
                          animate={{ opacity: [0.25, 1, 0.25], y: [0, -8, 0] }}
                          transition={{ duration: 1.1, repeat: Infinity, delay: item * 0.15 }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.65, ease: "easeOut" }}
                  className="relative min-h-[32vh] overflow-hidden py-8 text-center"
                >
                  <motion.div
                    className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-amber-200/25 to-transparent"
                    animate={{ x: ["0%", "420%"] }}
                    transition={{ duration: 1.2, delay: 0.2 }}
                  />
                  <div className="flex items-center justify-center gap-5">
                    <span className="h-px w-28 bg-gradient-to-r from-transparent to-amber-300" />
                    <p className="text-[clamp(1.5rem,2.2vw,2.25rem)] font-semibold tracking-[0.08em] text-amber-100">
                      抽中组别：
                    </p>
                    <span className="h-px w-28 bg-gradient-to-l from-transparent to-amber-300" />
                  </div>
                  <div className="mt-16 space-y-4">
                    {visibleGroups.map((group) => (
                      <p
                        key={group.id}
                        className="text-[clamp(4.6rem,8vw,8.8rem)] font-black tracking-[0.04em] text-amber-50 drop-shadow-[0_0_30px_rgba(251,191,36,0.38)]"
                      >
                        {group.name}
                      </p>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </aside>
        </div>

      </div>
      <span className="absolute bottom-4 right-4 h-2 w-2 rounded-full bg-emerald-400/80" />
    </main>
  );
}

function phaseText(phase: RuntimePhase) {
  const map: Record<RuntimePhase, string> = {
    idle: "等待抽奖",
    accelerating: "抽奖进行中...",
    spinning: "抽奖进行中...",
    decelerating: "即将揭晓...",
    suspense: "即将揭晓...",
    revealed: "本轮抽奖已完成",
    emergency: "等待抽奖",
  };
  return map[phase];
}
