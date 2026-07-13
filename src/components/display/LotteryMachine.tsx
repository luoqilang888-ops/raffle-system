"use client";

import { useEffect, useRef } from "react";
import type { RuntimePhase } from "@/lib/types";

type Ball = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
};

const colors = ["#f59e0b", "#fbbf24", "#d1d5db", "#fb923c", "#a3a3a3"];

export function LotteryMachine({
  phase,
  shakeStrength,
}: {
  phase: RuntimePhase;
  shakeStrength: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ballsRef = useRef<Ball[]>([]);
  const phaseRef = useRef(phase);
  const shakeRef = useRef(shakeStrength);

  useEffect(() => {
    phaseRef.current = phase;
    shakeRef.current = shakeStrength;
  }, [phase, shakeStrength]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const scale = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * scale);
      canvas.height = Math.floor(rect.height * scale);
      context.setTransform(scale, 0, 0, scale, 0, 0);
      if (ballsRef.current.length === 0) {
        ballsRef.current = createBalls(rect.width, rect.height);
      }
    };

    resize();
    window.addEventListener("resize", resize);

    let frame = 0;
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(32, now - last) / 16.67;
      last = now;
      frame += 1;
      draw(context, canvas, ballsRef.current, phaseRef.current, shakeRef.current, dt, frame);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-label="摇奖机动画"
      className="h-full w-full"
      data-testid="lottery-canvas"
    />
  );
}

function createBalls(width: number, height: number) {
  return Array.from({ length: 34 }, (_, index) => ({
    x: width * (0.25 + Math.random() * 0.5),
    y: height * (0.25 + Math.random() * 0.5),
    vx: (Math.random() - 0.5) * 5,
    vy: (Math.random() - 0.5) * 5,
    r: 13 + (index % 5) * 2,
    color: colors[index % colors.length],
  }));
}

function draw(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  balls: Ball[],
  phase: RuntimePhase,
  shakeStrength: number,
  dt: number,
  frame: number,
) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  context.clearRect(0, 0, width, height);

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.39;
  const speed = phaseSpeed(phase, frame);
  const shake = phase === "spinning" || phase === "decelerating"
    ? Math.sin(frame * 0.4) * shakeStrength
    : 0;

  context.save();
  context.translate(shake, 0);
  context.fillStyle = "rgba(255,255,255,0.045)";
  context.strokeStyle = "rgba(255,255,255,0.32)";
  context.lineWidth = 3;
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  context.strokeStyle = "rgba(251,191,36,0.45)";
  context.lineWidth = 8;
  context.beginPath();
  context.arc(centerX, centerY, radius + 7, Math.PI * 0.72, Math.PI * 0.28, true);
  context.stroke();

  for (const ball of balls) {
    if (speed > 0) {
      ball.vx += (Math.random() - 0.5) * speed * 0.9;
      ball.vy += (Math.random() - 0.5) * speed * 0.9 - 0.025;
    } else {
      ball.vx *= 0.94;
      ball.vy *= 0.94;
    }

    ball.vx = clamp(ball.vx, -10 * speed - 1, 10 * speed + 1);
    ball.vy = clamp(ball.vy, -10 * speed - 1, 10 * speed + 1);
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    const dx = ball.x - centerX;
    const dy = ball.y - centerY;
    const distance = Math.hypot(dx, dy);
    if (distance + ball.r > radius) {
      const nx = dx / distance;
      const ny = dy / distance;
      ball.x = centerX + nx * (radius - ball.r);
      ball.y = centerY + ny * (radius - ball.r);
      const dot = ball.vx * nx + ball.vy * ny;
      ball.vx = (ball.vx - 2 * dot * nx) * 0.9;
      ball.vy = (ball.vy - 2 * dot * ny) * 0.9;
    }

    if (speed > 1.7) {
      context.strokeStyle = `${ball.color}55`;
      context.lineWidth = ball.r * 0.7;
      context.beginPath();
      context.moveTo(ball.x - ball.vx * 2.3, ball.y - ball.vy * 2.3);
      context.lineTo(ball.x, ball.y);
      context.stroke();
    }

    const gradient = context.createRadialGradient(
      ball.x - ball.r * 0.35,
      ball.y - ball.r * 0.35,
      ball.r * 0.2,
      ball.x,
      ball.y,
      ball.r,
    );
    gradient.addColorStop(0, "#fff7ed");
    gradient.addColorStop(0.25, ball.color);
    gradient.addColorStop(1, "#3f3f46");
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    context.fill();
  }

  context.fillStyle = "rgba(15,23,42,0.4)";
  context.fillRect(centerX - radius * 0.36, centerY + radius * 0.88, radius * 0.72, 28);
  context.restore();
}

function phaseSpeed(phase: RuntimePhase, frame: number) {
  if (phase === "accelerating") return Math.min(2.2, 0.3 + frame * 0.018);
  if (phase === "spinning") return 2.6;
  if (phase === "decelerating") return 1.25;
  if (phase === "suspense") return 0.25;
  if (phase === "revealed" || phase === "idle" || phase === "emergency") return 0;
  return 0.5;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
