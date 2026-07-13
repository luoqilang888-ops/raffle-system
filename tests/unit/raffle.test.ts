import { describe, expect, it } from "vitest";
import { computeRemainingDraws, getRevealAt, isResultVisible, secureSampleGroups } from "@/lib/raffle";

describe("raffle logic", () => {
  it("samples unique groups without exceeding the pool", () => {
    const groups = [
      { id: "a" },
      { id: "b" },
      { id: "c" },
    ];
    const winners = secureSampleGroups(groups, 2);
    expect(winners).toHaveLength(2);
    expect(new Set(winners.map((winner) => winner.id)).size).toBe(2);
  });

  it("computes reveal time after deceleration and suspense", () => {
    const now = new Date("2026-07-13T10:00:00.000Z");
    const revealAt = getRevealAt(now, 2500, 1000);
    expect(revealAt.toISOString()).toBe("2026-07-13T10:00:03.800Z");
    expect(isResultVisible(revealAt.toISOString(), new Date("2026-07-13T10:00:03.700Z"))).toBe(false);
    expect(isResultVisible(revealAt.toISOString(), new Date("2026-07-13T10:00:03.900Z"))).toBe(true);
  });

  it("never returns a negative remaining draw count", () => {
    expect(computeRemainingDraws(2, 5)).toBe(0);
  });
});
