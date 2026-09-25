export interface RetryPolicy {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitterRatio?: number;
}

export interface RetryDecision {
  /** One-based count of attempts already completed. */
  completedAttempts: number;
  retryable: boolean;
  /** Must be explicitly true; non-idempotent actions are never retried by this planner. */
  idempotent: boolean;
  /** Deterministic default is 0.5 (no jitter). Inject a value in [0, 1] for jitter. */
  random?: number;
}

/** Pure backoff planner. It does not send requests, sleep, or retry automatically. */
export function nextRetryDelayMs(policy: RetryPolicy, decision: RetryDecision): number | null {
  const { maxAttempts, baseDelayMs, maxDelayMs, jitterRatio = 0 } = policy;
  const { completedAttempts, retryable, idempotent, random = 0.5 } = decision;
  if (
    !Number.isSafeInteger(maxAttempts) ||
    maxAttempts < 1 ||
    maxAttempts > 20 ||
    !Number.isFinite(baseDelayMs) ||
    baseDelayMs < 0 ||
    !Number.isFinite(maxDelayMs) ||
    maxDelayMs < baseDelayMs ||
    !Number.isFinite(jitterRatio) ||
    jitterRatio < 0 ||
    jitterRatio > 1 ||
    !Number.isSafeInteger(completedAttempts) ||
    completedAttempts < 1 ||
    !Number.isFinite(random) ||
    random < 0 ||
    random > 1
  ) {
    throw new Error('Invalid retry policy or decision.');
  }
  if (!retryable || !idempotent || completedAttempts >= maxAttempts) return null;
  const exponential = Math.min(maxDelayMs, baseDelayMs * 2 ** (completedAttempts - 1));
  return Math.min(
    maxDelayMs,
    Math.round(exponential * (1 - jitterRatio + 2 * jitterRatio * random)),
  );
}
