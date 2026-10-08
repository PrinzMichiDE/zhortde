/**
 * Pure redirect-target resolution for the public redirect pipeline.
 *
 * The redirect flow in `app/s/[shortCode]/route.ts` (and the masking
 * config route) needs a deterministic, dependency-free decision about
 * which URL to send a visitor to. Keeping this logic in a pure function
 * makes the precedence rules testable without a database.
 *
 * Precedence:
 *   1. An inactive schedule wins: the visitor is sent to the fallback URL,
 *      or receives an "inactive" signal when no fallback is configured.
 *   2. An A/B test variant (if one is the winner of the traffic split).
 *   3. The original long URL (smart redirect rules are applied on top by
 *      the caller and stay outside of this module).
 */

export interface ScheduleInfo {
  isActive: boolean;
  fallbackUrl?: string | null;
}

export type ResolvedRedirectTarget =
  | { kind: 'schedule-inactive'; url?: string | null }
  | { kind: 'continue'; url: string };

export function resolveRedirectTarget(params: {
  longUrl: string;
  schedule: ScheduleInfo | null;
  variantUrl: string | null;
}): ResolvedRedirectTarget {
  const { longUrl, schedule, variantUrl } = params;

  // 1. Inactive schedule (not yet active or already ended)
  if (schedule && !schedule.isActive) {
    return { kind: 'schedule-inactive', url: schedule.fallbackUrl ?? null };
  }

  // 2. A/B variant wins the split, 3. otherwise the long URL
  return { kind: 'continue', url: variantUrl ?? longUrl };
}