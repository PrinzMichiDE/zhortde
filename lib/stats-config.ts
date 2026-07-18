export const INITIAL_STATS = {
  visitors: 126_819,
  links: 126_819,
} as const;

export type StatKey = keyof typeof INITIAL_STATS;

export function getInitialStat(key: string): number {
  if (key in INITIAL_STATS) {
    return INITIAL_STATS[key as StatKey];
  }
  return 0;
}
