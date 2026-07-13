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
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#070b12]">
          <div className="text-center">
            <p className="text-3xl font-semibold">会场抽奖</p>
            <button
              className="mt-8 rounded-md bg-amber-500 px-8 py-4 text-lg font-semibold text-slate-950 transition hover:bg-amber-400"
              onClick={enterVenueMode}
            >
              点击进入会场模式并启用音效
            </button>
          </div>
        </div>
      )}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_20%,rgba(245,158,11,0.16),transparent_34%),linear-gradient(135deg,#05070d,#101928_52%,#07111f)]" />
      <div className="relative grid min-h-screen grid-cols-[1.12fr_0.88fr] gap-10 px-[5vw] py-[5vh]">
        <section className="flex flex-col">
          <header>
            <p className="text-xl font-medium text-amber-300">会场抽奖</p>
            <h1 className="mt-4 text-6xl font-semibold tracking-normal text-white">
              {state.event.name}
            </h1>
          </header>
          <div className="mt-8 flex flex-1 items-center justify-center">
            <div className="h-[54vh] w-[54vh] max-w-full">
              <LotteryMachine
                phase={state.runtime.settings.animation_enabled ? localPhase : "idle"}
                shakeStrength={state.runtime.settings.shake_strength}
              />
            </div>
          </div>
          <p className="pb-6 text-center text-3xl font-semibold text-slate-200">
            {phaseText(localPhase)}
          </p>
        </section>

        <aside className="flex items-center justify-center">
          <div className="w-full rounded-lg border border-white/10 bg-white/[0.045] p-10 shadow-2xl backdrop-blur">
            {visibleGroups.length === 0 ? (
              <div className="py-24 text-center">
                <p className="text-4xl font-semibold text-slate-200">
                  {localPhase === "idle" ? "等待抽奖" : "抽奖进行中"}
                </p>
                {localPhase !== "idle" && (
                  <div className="mx-auto mt-8 flex w-20 justify-between">
                    {[0, 1, 2].map((item) => (
                      <motion.span
                        key={item}
                        className="h-3 w-3 rounded-full bg-amber-300"
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
                className="relative overflow-hidden py-12 text-center"
              >
                <motion.div
                  className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-amber-200/20 to-transparent"
                  animate={{ x: ["0%", "420%"] }}
                  transition={{ duration: 1.2, delay: 0.2 }}
                />
                <p className="text-3xl font-medium text-amber-200">抽中组别：</p>
                <div className="mt-8 space-y-4">
                  {visibleGroups.map((group) => (
                    <p
                      key={group.id}
                      className="text-7xl font-bold tracking-normal text-white drop-shadow-[0_0_30px_rgba(251,191,36,0.35)]"
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
