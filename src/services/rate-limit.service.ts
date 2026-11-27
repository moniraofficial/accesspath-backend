import { FailedLogin } from "../models/failed-login.model.js";

const MAX_ATOMIC_RETRIES = 3;

export const LOGIN_IP_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const LOGIN_IP_MAX_ATTEMPTS = 30;

export const LOGIN_IP_EMAIL_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const LOGIN_IP_EMAIL_MAX_ATTEMPTS = 5;

function isDuplicateOrTransientError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const err = error as { code?: number; codeName?: string };
  return err.code === 11000 || err.code === 112 || err.codeName === "WriteConflict";
}

/**
 * Atomically increments a sliding/fixed-window counter in MongoDB using an
 * aggregation-pipeline findOneAndUpdate.
 *
 * Why this prevents lost-update races:
 * - If the record is missing OR expired (expiresAt <= now), it atomically sets attempts = 1
 *   and resets expiresAt = now + windowMs in a single server-side operation.
 * - If the record exists and is non-expired, it atomically increments attempts by 1 and
 *   preserves the existing expiresAt.
 * - Retries up to MAX_ATOMIC_RETRIES times on E11000 duplicate-key races during concurrent first-inserts.
 */
export async function atomicIncrementCounter(
  key: string,
  windowMs: number
): Promise<{ attempts: number; expiresAt: Date }> {
  for (let attempt = 0; attempt < MAX_ATOMIC_RETRIES; attempt++) {
    const now = new Date();
    const nextExpiresAt = new Date(now.getTime() + windowMs);

    try {
      const updated = await FailedLogin.findOneAndUpdate(
        { key },
        [
          {
            $set: {
              key,
              attempts: {
                $cond: {
                  if: {
                    $or: [
                      { $eq: [{ $type: "$expiresAt" }, "missing"] },
                      { $lte: ["$expiresAt", now] },
                    ],
                  },
                  then: 1,
                  else: { $add: [{ $ifNull: ["$attempts", 0] }, 1] },
                },
              },
              expiresAt: {
                $cond: {
                  if: {
                    $or: [
                      { $eq: [{ $type: "$expiresAt" }, "missing"] },
                      { $lte: ["$expiresAt", now] },
                    ],
                  },
                  then: nextExpiresAt,
                  else: "$expiresAt",
                },
              },
            },
          },
        ],
        {
          upsert: true,
          returnDocument: "after",
          updatePipeline: true,
        }
      ).lean();

      if (!updated) {
        throw new Error("Atomic counter update returned null.");
      }

      return {
        attempts: updated.attempts,
        expiresAt: updated.expiresAt,
      };
    } catch (error: unknown) {
      if (isDuplicateOrTransientError(error) && attempt < MAX_ATOMIC_RETRIES - 1) {
        continue;
      }
      throw error;
    }
  }

  throw new Error("Exceeded maximum retries for atomic counter increment.");
}

/**
 * Checks whether a counter key has reached or exceeded `maxAttempts` within an active window.
 */
export async function isCounterBlocked(key: string, maxAttempts: number): Promise<boolean> {
  const now = new Date();
  const record = await FailedLogin.findOne({
    key,
    expiresAt: { $gt: now },
  })
    .select("attempts")
    .lean();

  return Boolean(record && record.attempts >= maxAttempts);
}

export function buildIpKey(ip: string): string {
  return `login:ip:${ip}`;
}

export function buildIpEmailKey(ip: string, normalizedEmail: string): string {
  return `login:ip_email:${ip}:${normalizedEmail}`;
}

/**
 * Checks both IP-wide and IP+email failed-login counters before authentication.
 */
export async function isLoginBlocked(ip: string, normalizedEmail: string): Promise<boolean> {
  const [ipBlocked, ipEmailBlocked] = await Promise.all([
    isCounterBlocked(buildIpKey(ip), LOGIN_IP_MAX_ATTEMPTS),
    isCounterBlocked(buildIpEmailKey(ip, normalizedEmail), LOGIN_IP_EMAIL_MAX_ATTEMPTS),
  ]);
  return ipBlocked || ipEmailBlocked;
}

/**
 * Atomically records a failed login attempt on both the IP-wide and IP+email counters.
 */
export async function recordFailedLogin(ip: string, normalizedEmail: string): Promise<void> {
  await Promise.all([
    atomicIncrementCounter(buildIpKey(ip), LOGIN_IP_WINDOW_MS),
    atomicIncrementCounter(buildIpEmailKey(ip, normalizedEmail), LOGIN_IP_EMAIL_WINDOW_MS),
  ]);
}

/**
 * Resets ONLY the IP+email-specific counter after a successful login.
 * Intentionally preserves the IP-wide counter so one valid account login
 * does not clear brute-force tracking against other accounts from that IP.
 */
export async function resetIpEmailFailedLogin(ip: string, normalizedEmail: string): Promise<void> {
  await FailedLogin.deleteOne({ key: buildIpEmailKey(ip, normalizedEmail) });
}
