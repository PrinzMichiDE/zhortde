/**
 * Plausible seed statistics shown before real traffic accumulates.
 * Visitors are intentionally higher than links — typical for a URL shortener.
 */
export const INITIAL_STATS = {
  visitors: 267_843,
  links: 71_529,
} as const;

export type StatKey = keyof typeof INITIAL_STATS;

export function getInitialStat(key: string): number {
  if (key in INITIAL_STATS) {
    return INITIAL_STATS[key as StatKey];
  }
  return 0;
}
