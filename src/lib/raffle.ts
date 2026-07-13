import type { RaffleGroup } from "@/lib/types";

export function secureSampleGroups<T extends Pick<RaffleGroup, "id">>(
  groups: T[],
  count: number,
): T[] {
  if (count < 1) return [];
  if (groups.length === 0) return [];

  const pool = [...groups];
  const take = Math.min(count, pool.length);
  const winners: T[] = [];

  for (let i = 0; i < take; i += 1) {
    const index = secureRandomInt(pool.length);
    winners.push(pool[index]);
    pool.splice(index, 1);
  }

  return winners;
}

export function secureRandomInt(maxExclusive: number) {
  if (maxExclusive <= 0) {
    throw new Error("maxExclusive must be greater than 0");
  }

  const maxUint32 = 0xffffffff;
  const limit = maxUint32 - (maxUint32 % maxExclusive);
  const buffer = new Uint32Array(1);

  do {
    crypto.getRandomValues(buffer);
  } while (buffer[0] >= limit);

  return buffer[0] % maxExclusive;
}

export function getRevealAt(
  now = new Date(),
  decelerationMs = 2500,
  suspenseMs = 1000,
) {
  return new Date(now.getTime() + 300 + decelerationMs + suspenseMs);
}

export function isResultVisible(revealAt: string | null, now = new Date()) {
  if (!revealAt) return false;
  return now.getTime() >= new Date(revealAt).getTime();
}

export function computeRemainingDraws(total: number, completed: number) {
  return Math.max(0, total - completed);
}
