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

const colors = ["#d89137", "#f2bd61", "#aeb7c4", "#ec744c", "#6f7b8b"];

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
  const radius = Math.min(width, height) * 0.37;
  const speed = phaseSpeed(phase, frame);
  const shake = phase === "spinning" || phase === "decelerating"
    ? Math.sin(frame * 0.4) * shakeStrength
    : 0;

  context.save();
  context.translate(shake, 0);
  context.shadowBlur = 32;
  context.shadowColor = "rgba(245,158,11,0.28)";
  context.fillStyle = "rgba(255,255,255,0.055)";
  context.strokeStyle = "rgba(255,255,255,0.42)";
  context.lineWidth = 4;
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.shadowBlur = 0;

  const glass = context.createLinearGradient(
    centerX - radius,
    centerY - radius,
    centerX + radius,
    centerY + radius,
  );
  glass.addColorStop(0, "rgba(255,255,255,0.56)");
  glass.addColorStop(0.18, "rgba(255,255,255,0.04)");
  glass.addColorStop(0.58, "rgba(255,255,255,0.02)");
  glass.addColorStop(1, "rgba(255,255,255,0.22)");
  context.strokeStyle = glass;
  context.lineWidth = 10;
  context.beginPath();
  context.arc(centerX, centerY, radius - 6, Math.PI * 0.84, Math.PI * 1.72);
  context.stroke();

  context.strokeStyle = "rgba(251,191,36,0.45)";
  context.lineWidth = 2;
  for (let i = 0; i < 3; i += 1) {
    const offset = i * 16;
    context.beginPath();
    context.arc(
      centerX,
      centerY,
      radius + 18 + offset,
      Math.PI * (0.76 + i * 0.02),
      Math.PI * (1.25 + i * 0.04),
    );
    context.stroke();
    context.beginPath();
    context.arc(
      centerX,
      centerY,
      radius + 18 + offset,
      Math.PI * (1.76 - i * 0.02),
      Math.PI * (2.25 - i * 0.04),
    );
    context.stroke();
  }

  context.strokeStyle = "rgba(251,191,36,0.8)";
  context.lineWidth = 7;
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
      context.strokeStyle = `${ball.color}66`;
      context.lineWidth = ball.r * 0.82;
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
    gradient.addColorStop(0, "#fff9ec");
    gradient.addColorStop(0.25, ball.color);
    gradient.addColorStop(1, "#3f3f46");
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    context.fill();
  }

  const baseY = centerY + radius * 0.88;
  const baseWidth = radius * 1.48;
  const base = context.createLinearGradient(0, baseY, 0, baseY + 72);
  base.addColorStop(0, "#43454c");
  base.addColorStop(0.32, "#141820");
  base.addColorStop(1, "#07090d");
  context.fillStyle = base;
  roundRect(context, centerX - baseWidth / 2, baseY, baseWidth, 72, 28);
  context.fill();

  context.shadowBlur = 24;
  context.shadowColor = "rgba(245,158,11,0.65)";
  context.strokeStyle = "rgba(251,191,36,0.9)";
  context.lineWidth = 5;
  context.beginPath();
  context.ellipse(centerX, baseY + 8, baseWidth * 0.45, 15, 0, 0, Math.PI * 2);
  context.stroke();
  context.shadowBlur = 0;
  context.restore();
}

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
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
